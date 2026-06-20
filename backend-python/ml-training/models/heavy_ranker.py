"""
Heavy Ranker model training — multi-task neural network.

Prediction heads (mirrors X algorithm):
  - P(favorite | impression)
  - P(retweet | impression)
  - P(reply | impression)
  - P(click | impression)
  - P(dwell > threshold | impression)

Export: TorchScript → Rust serving via ONNX or custom weight loader.
"""

from __future__ import annotations

import torch
import torch.nn as nn
from dataclasses import dataclass


@dataclass
class ModelConfig:
    user_feature_dim: int = 64
    post_feature_dim: int = 48
    author_feature_dim: int = 32
    hidden_dim: int = 256
    num_heads: int = 5


class HeavyRankerModel(nn.Module):
    def __init__(self, config: ModelConfig = ModelConfig()):
        super().__init__()
        self.config = config

        input_dim = config.user_feature_dim + config.post_feature_dim + config.author_feature_dim

        self.shared = nn.Sequential(
            nn.Linear(input_dim, config.hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(config.hidden_dim, config.hidden_dim),
            nn.ReLU(),
        )

        self.heads = nn.ModuleDict({
            "p_like": nn.Linear(config.hidden_dim, 1),
            "p_repost": nn.Linear(config.hidden_dim, 1),
            "p_reply": nn.Linear(config.hidden_dim, 1),
            "p_click": nn.Linear(config.hidden_dim, 1),
            "p_dwell": nn.Linear(config.hidden_dim, 1),
        })

    def forward(
        self,
        user_features: torch.Tensor,
        post_features: torch.Tensor,
        author_features: torch.Tensor,
    ) -> dict[str, torch.Tensor]:
        x = torch.cat([user_features, post_features, author_features], dim=-1)
        shared = self.shared(x)
        return {name: torch.sigmoid(head(shared)) for name, head in self.heads.items()}


def train_epoch(model: HeavyRankerModel, dataloader, optimizer, device: str = "cpu") -> float:
    model.train()
    total_loss = 0.0
    criterion = nn.BCELoss()

    for batch in dataloader:
        user_f = batch["user_features"].to(device)
        post_f = batch["post_features"].to(device)
        author_f = batch["author_features"].to(device)
        labels = {k: v.to(device) for k, v in batch["labels"].items()}

        optimizer.zero_grad()
        predictions = model(user_f, post_f, author_f)

        loss = sum(criterion(predictions[k], labels[k]) for k in predictions) / len(predictions)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    return total_loss / len(dataloader)


def export_for_serving(model: HeavyRankerModel, path: str) -> None:
    """Export TorchScript for Rust inference runtime."""
    model.eval()
    example_user = torch.randn(1, model.config.user_feature_dim)
    example_post = torch.randn(1, model.config.post_feature_dim)
    example_author = torch.randn(1, model.config.author_feature_dim)

    traced = torch.jit.trace(model, (example_user, example_post, example_author))
    traced.save(path)
    print(f"Exported model to {path}")