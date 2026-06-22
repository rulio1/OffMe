package com.offme.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Repeat
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.offme.data.api.ApiClient
import com.offme.data.models.Post
import com.offme.util.Formatters
import kotlinx.coroutines.launch

private val LikeColor = Color(0xFFF91880)
private val RepostColor = Color(0xFF00BA7C)

@Composable
fun PostRow(
    post: Post,
    api: ApiClient,
    token: String?,
    onAuthorClick: (String) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var liked by remember(post.id) { mutableStateOf(post.likedByMe ?: false) }
    var likeCount by remember(post.id) { mutableIntStateOf(post.likeCount) }
    var reposted by remember(post.id) { mutableStateOf(post.repostedByMe ?: false) }
    var repostCount by remember(post.id) { mutableIntStateOf(post.repostCount) }
    var liking by remember(post.id) { mutableStateOf(false) }
    var reposting by remember(post.id) { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val authorName = post.author?.resolvedDisplayName ?: "Usuário"
    val username = post.author?.username ?: "usuario"

    Column(modifier = modifier.fillMaxWidth()) {
        if (post.timelineSource == "repost") {
            Text(
                text = "Repost",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                modifier = Modifier.padding(start = 68.dp, bottom = 8.dp),
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            UserAvatar(
                url = post.author?.avatarUrl,
                size = 40.dp,
                modifier = Modifier.clickable { onAuthorClick(username) },
            )

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = authorName,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.clickable { onAuthorClick(username) },
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        text = "@$username",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    )
                    Text(
                        text = " · ${Formatters.timeAgo(post.createdAt)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    )
                }

                if (post.text.isNotBlank()) {
                    Text(
                        text = post.text,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }

                post.mediaUrls?.takeIf { it.isNotEmpty() }?.let { urls ->
                    PostMediaGrid(urls = urls, modifier = Modifier.padding(top = 8.dp))
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    PostAction(
                        icon = Icons.Outlined.ChatBubbleOutline,
                        count = post.replyCount,
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    )

                    PostAction(
                        icon = if (reposted) Icons.Filled.Repeat else Icons.Outlined.Repeat,
                        count = repostCount,
                        tint = if (reposted) RepostColor else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        onClick = if (token != null && !reposting) {
                            {
                                scope.launch {
                                    reposting = true
                                    val wasReposted = reposted
                                    reposted = !wasReposted
                                    repostCount = if (wasReposted) maxOf(repostCount - 1, 0) else repostCount + 1
                                    try {
                                        val result = if (wasReposted) {
                                            api.unrepostPost(token, post.id)
                                        } else {
                                            api.repostPost(token, post.id)
                                        }
                                        reposted = result.repostedByMe
                                        repostCount = result.repostCount
                                    } catch (_: Exception) {
                                        reposted = wasReposted
                                        repostCount = post.repostCount
                                    } finally {
                                        reposting = false
                                    }
                                }
                            }
                        } else null,
                    )

                    PostAction(
                        icon = if (liked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        count = likeCount,
                        tint = if (liked) LikeColor else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        onClick = if (token != null && !liking) {
                            {
                                scope.launch {
                                    liking = true
                                    val wasLiked = liked
                                    liked = !wasLiked
                                    likeCount = if (wasLiked) maxOf(likeCount - 1, 0) else likeCount + 1
                                    try {
                                        val result = if (wasLiked) {
                                            api.unlikePost(token, post.id)
                                        } else {
                                            api.likePost(token, post.id)
                                        }
                                        liked = result.likedByMe
                                        likeCount = result.likeCount
                                    } catch (_: Exception) {
                                        liked = wasLiked
                                        likeCount = post.likeCount
                                    } finally {
                                        liking = false
                                    }
                                }
                            }
                        } else null,
                    )
                }
            }
        }
    }
}

@Composable
private fun PostAction(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    count: Int,
    tint: Color,
    onClick: (() -> Unit)? = null,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(vertical = 4.dp),
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(18.dp))
        if (count > 0) {
            Spacer(Modifier.width(4.dp))
            Text(
                text = Formatters.count(count),
                style = MaterialTheme.typography.labelMedium,
                color = tint,
            )
        }
    }
}

@Composable
private fun PostMediaGrid(
    urls: List<String>,
    modifier: Modifier = Modifier,
) {
    if (urls.size == 1) {
        AsyncImage(
            model = urls.first(),
            contentDescription = null,
            modifier = modifier
                .fillMaxWidth()
                .height(220.dp)
                .clip(RoundedCornerShape(16.dp)),
            contentScale = ContentScale.Crop,
        )
    } else {
        Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            urls.take(4).chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    row.forEach { url ->
                        AsyncImage(
                            model = url,
                            contentDescription = null,
                            modifier = Modifier
                                .weight(1f)
                                .height(120.dp)
                                .clip(RoundedCornerShape(12.dp)),
                            contentScale = ContentScale.Crop,
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PostDivider() {
    HorizontalDivider(
        thickness = 0.5.dp,
        color = MaterialTheme.colorScheme.outline.copy(alpha = 0.35f),
    )
}