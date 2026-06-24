// Basic internationalization system
type StringKey =
  | 'post.like'
  | 'post.unlike'
  | 'post.repost'
  | 'post.unrepost'
  | 'post.bookmark'
  | 'post.unbookmark'
  | 'post.share'
  | 'post.reply'
  | 'post.views'
  | 'post.delete'
  | 'post.pin'
  | 'post.unpin'
  | 'error.like'
  | 'error.repost'
  | 'error.bookmark'
  | 'error.generic'
  | 'menu.mute'
  | 'menu.block'
  | 'menu.report'
  | 'menu.delete'
  | 'menu.pin'
  | 'menu.unpin'
  | 'menu.reportSpam'
  | 'menu.reportAbuse'
  | 'menu.reportOther'
  | 'menu.back'
  | 'post.quoted'
  | 'post.mediaSingle'
  | 'post.mediaMultiple'
  | 'poll.vote'
  | 'poll.votes'
  | 'poll.ended';

interface Strings {
  [key: string]: string;
}

const enStrings: Strings = {
  'post.like': 'Like',
  'post.unlike': 'Unlike',
  'post.repost': 'Repost',
  'post.unrepost': 'Undo Repost',
  'post.bookmark': 'Save',
  'post.unbookmark': 'Remove from saved',
  'post.share': 'Share',
  'post.reply': 'Reply',
  'post.views': 'Views',
  'post.delete': 'Delete post',
  'post.pin': 'Pin to profile',
  'post.unpin': 'Unpin from profile',
  'error.like': 'Failed to process like. Please try again.',
  'error.repost': 'Failed to process repost. Please try again.',
  'error.bookmark': 'Failed to save post. Please try again.',
  'error.generic': 'An error occurred. Please try again.',
  'menu.mute': 'Mute @{username}',
  'menu.block': 'Block @{username}',
  'menu.report': 'Report post',
  'menu.delete': 'Delete post',
  'menu.pin': 'Pin to profile',
  'menu.unpin': 'Unpin from profile',
  'menu.reportSpam': 'Spam',
  'menu.reportAbuse': 'Abuse or harassment',
  'menu.reportOther': 'Other',
  'menu.back': 'Back',
  'post.quoted': 'Quoted post',
  'post.mediaSingle': 'Attached image',
  'post.mediaMultiple': '{count} attached media',
  'poll.vote': 'Vote in: {option}',
  'poll.votes': '{count} vote{s}',
  'poll.ended': ' · Ended',
};

const ptStrings: Strings = {
  'post.like': 'Curtir',
  'post.unlike': 'Descurtir',
  'post.repost': 'Repostar',
  'post.unrepost': 'Desfazer repost',
  'post.bookmark': 'Salvar',
  'post.unbookmark': 'Remover dos salvos',
  'post.share': 'Compartilhar',
  'post.reply': 'Responder',
  'post.views': 'Visualizações',
  'post.delete': 'Excluir post',
  'post.pin': 'Fixar no perfil',
  'post.unpin': 'Desfixar do perfil',
  'error.like': 'Falha ao processar sua curtida. Por favor, tente novamente.',
  'error.repost': 'Falha ao processar seu repost. Por favor, tente novamente.',
  'error.bookmark': 'Falha ao salvar o post. Por favor, tente novamente.',
  'error.generic': 'Ocorreu um erro. Por favor, tente novamente.',
  'menu.mute': 'Silenciar @{username}',
  'menu.block': 'Bloquear @{username}',
  'menu.report': 'Denunciar post',
  'menu.delete': 'Excluir post',
  'menu.pin': 'Fixar no perfil',
  'menu.unpin': 'Desfixar do perfil',
  'menu.reportSpam': 'Spam',
  'menu.reportAbuse': 'Abuso ou assédio',
  'menu.reportOther': 'Outro',
  'menu.back': 'Voltar',
  'post.quoted': 'Post citado',
  'post.mediaSingle': 'Imagem anexada',
  'post.mediaMultiple': '{count} mídia(s) anexada(s)',
  'poll.vote': 'Votar em: {option}',
  'poll.votes': '{count} voto{s}',
  'poll.ended': ' · Encerrada',
};

// Simple format function for string replacement
function formatString(str: string, replacements: Record<string, string | number> = {}): string {
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return replacements[key]?.toString() || match;
  });
}

// Get current language from browser or use default
function getCurrentLanguage(): 'pt' | 'en' {
  if (typeof window !== 'undefined') {
    const lang = navigator.language.split('-')[0];
    return lang === 'pt' ? 'pt' : 'en';
  }
  return 'en';
}

// Get strings for current language
export function getStrings(): Strings {
  const lang = getCurrentLanguage();
  return lang === 'pt' ? ptStrings : enStrings;
}

// Get formatted string
export function t(key: StringKey, replacements: Record<string, string | number> = {}): string {
  const strings = getStrings();
  const template = strings[key] || key;
  return formatString(template, replacements);
}

// Hook for components
export function useStrings() {
  return { t, getStrings, currentLanguage: getCurrentLanguage() };
}