package com.offme.ui.components

import android.content.Intent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Repeat
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.platform.LocalContext
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
    currentUserId: Int? = null,
    onAuthorClick: (String) -> Unit = {},
    onPostClick: (Int) -> Unit = {},
    onDeleted: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    var dismissed by remember(post.id) { mutableStateOf(false) }
    if (dismissed) return

    var liked by remember(post.id) { mutableStateOf(post.likedByMe ?: false) }
    var likeCount by remember(post.id) { mutableIntStateOf(post.likeCount) }
    var reposted by remember(post.id) { mutableStateOf(post.repostedByMe ?: false) }
    var repostCount by remember(post.id) { mutableIntStateOf(post.repostCount) }
    var bookmarked by remember(post.id) { mutableStateOf(post.bookmarkedByMe ?: false) }
    var liking by remember(post.id) { mutableStateOf(false) }
    var reposting by remember(post.id) { mutableStateOf(false) }
    var bookmarking by remember(post.id) { mutableStateOf(false) }
    var deleting by remember(post.id) { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    val authorName = post.author?.resolvedDisplayName ?: "Usuário"
    val username = post.author?.username ?: "usuario"
    val isOwnPost = currentUserId != null &&
        (post.authorId == currentUserId || post.author?.id == currentUserId)
    val shareUrl = "https://offme.vercel.app/post/${post.id}"

    Column(modifier = modifier.fillMaxWidth()) {
        if (post.timelineSource == "repost") {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(start = 68.dp, bottom = 8.dp),
            ) {
                Icon(
                    imageVector = ActionIcons.Repost,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    modifier = Modifier.size(14.dp),
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "Repost",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                )
            }
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
                    Spacer(Modifier.weight(1f))
                    Box {
                        IconButton(onClick = { showMenu = true }, modifier = Modifier.size(32.dp)) {
                            Icon(
                                Icons.Default.MoreVert,
                                contentDescription = "Mais opções",
                                modifier = Modifier.size(18.dp),
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            )
                        }
                        DropdownMenu(expanded = showMenu, onDismissRequest = { showMenu = false }) {
                            if (isOwnPost) {
                                DropdownMenuItem(
                                    text = { Text("Excluir post") },
                                    onClick = {
                                        showMenu = false
                                        showDeleteConfirm = true
                                    },
                                    enabled = !deleting,
                                )
                            }
                            DropdownMenuItem(
                                text = { Text("Ocultar post") },
                                onClick = {
                                    showMenu = false
                                    dismissed = true
                                },
                            )
                        }
                    }
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
                        icon = ActionIcons.Reply,
                        count = post.replyCount,
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        onClick = { onPostClick(post.id) },
                    )

                    PostAction(
                        icon = ActionIcons.Repost,
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
                        icon = ActionIcons.HeartFilled,
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

                    PostAction(
                        icon = ActionIcons.Share,
                        count = 0,
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        onClick = {
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, shareUrl)
                            }
                            context.startActivity(Intent.createChooser(intent, "Compartilhar post"))
                        },
                    )

                    PostAction(
                        icon = ActionIcons.BookmarkFilled,
                        count = 0,
                        tint = if (bookmarked) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        },
                        onClick = if (token != null && !bookmarking) {
                            {
                                scope.launch {
                                    bookmarking = true
                                    val wasBookmarked = bookmarked
                                    bookmarked = !wasBookmarked
                                    try {
                                        val result = if (wasBookmarked) {
                                            api.unbookmarkPost(token, post.id)
                                        } else {
                                            api.bookmarkPost(token, post.id)
                                        }
                                        bookmarked = result.bookmarkedByMe
                                    } catch (_: Exception) {
                                        bookmarked = wasBookmarked
                                    } finally {
                                        bookmarking = false
                                    }
                                }
                            }
                        } else null,
                    )
                }
            }
        }
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Excluir este post?") },
            text = { Text("Esta ação não pode ser desfeita.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteConfirm = false
                        val t = token ?: return@TextButton
                        scope.launch {
                            deleting = true
                            try {
                                api.deletePost(t, post.id)
                                dismissed = true
                                onDeleted()
                            } catch (_: Exception) {
                                // Keep post visible on failure.
                            } finally {
                                deleting = false
                            }
                        }
                    },
                ) {
                    Text("Excluir", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancelar")
                }
            },
        )
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