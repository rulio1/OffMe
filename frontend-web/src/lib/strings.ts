/**
 * Internationalization strings for OffMe web application
 * Centralized string management for multi-language support
 */
export const strings = {
  // Common strings
  common: {
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Salvar',
    close: 'Fechar',
    search: 'Pesquisar',
    noResults: 'Nenhum resultado encontrado',
    tryAgain: 'Tente novamente',
    back: 'Voltar',
    more: 'Mais',
    less: 'Menos',
  },

  // Authentication
  auth: {
    login: 'Entrar',
    register: 'Cadastrar',
    logout: 'Sair',
    email: 'Email',
    password: 'Senha',
    username: 'Nome de usuário',
    displayName: 'Nome de exibição',
    forgotPassword: 'Esqueceu a senha?',
    createAccount: 'Criar conta',
    alreadyHaveAccount: 'Já tem uma conta?',
    dontHaveAccount: 'Não tem uma conta?',
    loginWith: 'Entrar com {{provider}}',
    privacyPolicy: 'Política de Privacidade',
    termsOfService: 'Termos de Serviço',
  },

  // Validation errors
  validation: {
    required: 'Este campo é obrigatório',
    invalidEmail: 'Email inválido',
    invalidUsername: 'Nome de usuário inválido',
    passwordTooShort: 'Senha muito curta (mínimo 8 caracteres)',
    passwordsDontMatch: 'As senhas não coincidem',
    weakPassword: 'Senha fraca',
    usernameTaken: 'Nome de usuário já está em uso',
    emailTaken: 'Email já está em uso',
    invalidCredentials: 'Email ou senha inválidos',
  },

  // Post creation
  post: {
    createPost: 'Criar post',
    whatIsHappening: 'O que está acontecendo?',
    postPlaceholder: 'Compartilhe seus pensamentos...',
    postButton: 'Postar',
    reply: 'Responder',
    repost: 'Repostar',
    like: 'Curtir',
    unlike: 'Descurtir',
    bookmark: 'Salvar',
    unbookmark: 'Remover dos salvos',
    share: 'Compartilhar',
    deletePost: 'Excluir post',
    editPost: 'Editar post',
    reportPost: 'Denunciar post',
    hidePost: 'Ocultar post',
    showMore: 'Mostrar mais',
    showLess: 'Mostrar menos',
    views: '{{count}} visualização{{plural}}',
    likes: '{{count}} curtida{{plural}}',
    reposts: '{{count}} repostagem{{n}}',
    replies: '{{count}} resposta{{plural}}',
    bookmarks: '{{count}} salvo{{plural}}',
    postedAt: 'Postado em {{date}}',
    scheduledFor: 'Agendado para {{date}}',
    schedulePost: 'Agendar post',
    postScheduled: 'Post agendado para {{date}}',
    mediaAlt: 'Mídia do post {{postId}}',
    poll: 'Enquete',
    pollOption: 'Opção {{number}}',
    pollVotes: '{{count}} voto{{plural}}',
    daysLeft: '{{count}} dia{{plural}} restante{{plural}}',
    hoursLeft: '{{count}} hora{{plural}} restante{{plural}}',
    minutesLeft: '{{count}} minuto{{plural}} restante{{plural}}',
  },

  // Feed/Timeline
  feed: {
    home: 'Início',
    latest: 'Mais recentes',
    top: 'Principais',
    following: 'Seguindo',
    forYou: 'Para você',
    trending: 'Em alta',
    refresh: 'Atualizar feed',
    loadMore: 'Carregar mais',
    noPosts: 'Nenhum post ainda',
    noPostsFollowing: 'Ninguém que você segue postou ainda',
    suggestedUsers: 'Pessoas que você pode seguir',
    explore: 'Explorar',
    searchPosts: 'Pesquisar posts',
    searchUsers: 'Pesquisar pessoas',
  },

  // User profiles
  profile: {
    profile: 'Perfil',
    editProfile: 'Editar perfil',
    followers: 'Seguidores',
    following: 'Seguindo',
    posts: 'Posts',
    likes: 'Curtidas',
    media: 'Mídia',
    about: 'Sobre',
    location: 'Localização',
    website: 'Website',
    joined: 'Entrou em {{date}}',
    noBio: 'Este usuário não tem uma bio.',
    privateAccount: 'Conta privada',
    follow: 'Seguir',
    unfollow: 'Deixar de seguir',
    followingYou: 'Segue você',
    message: 'Mensagem',
    reportUser: 'Denunciar usuário',
    blockUser: 'Bloquear usuário',
    muteUser: 'Silenciar usuário',
    copyLink: 'Copiar link do perfil',
  },

  // Notifications
  notifications: {
    notifications: 'Notificações',
    all: 'Todas',
    mentions: 'Menções',
    likes: 'Curtidas',
    reposts: 'Repostagens',
    follows: 'Novos seguidores',
    noNotifications: 'Nenhuma notificação ainda',
    markAllRead: 'Marcar todas como lidas',
    notificationSettings: 'Configurações de notificação',
    likedYourPost: '{{user}} curtiu seu post',
    repostedYourPost: '{{user}} repostou seu post',
    mentionedYou: '{{user}} mencionou você',
    followedYou: '{{user}} começou a seguir você',
    commentedOnYourPost: '{{user}} comentou em seu post',
    newFollower: 'Novo seguidor',
    notificationTime: '{{time}} atrás',
  },

  // Messages
  messages: {
    messages: 'Mensagens',
    newMessage: 'Nova mensagem',
    noMessages: 'Nenhuma mensagem ainda',
    searchMessages: 'Pesquisar mensagens',
    startConversation: 'Iniciar conversa',
    typing: '{{user}} está digitando...',
    online: 'Online',
    offline: 'Offline',
    lastSeen: 'Visto por último {{time}}',
    messagePlaceholder: 'Digite uma mensagem...',
    send: 'Enviar',
    unsend: 'Cancelar envio',
    deleteMessage: 'Excluir mensagem',
    deleteConversation: 'Excluir conversa',
    blockUser: 'Bloquear usuário',
    reportUser: 'Denunciar usuário',
  },

  // Settings
  settings: {
    settings: 'Configurações',
    account: 'Conta',
    privacy: 'Privacidade',
    notifications: 'Notificações',
    appearance: 'Aparência',
    language: 'Idioma',
    accessibility: 'Acessibilidade',
    help: 'Ajuda',
    about: 'Sobre',
    logout: 'Sair',
    deleteAccount: 'Excluir conta',
    changePassword: 'Alterar senha',
    changeEmail: 'Alterar email',
    changeUsername: 'Alterar nome de usuário',
    exportData: 'Exportar dados',
    darkMode: 'Modo escuro',
    lightMode: 'Modo claro',
    systemPreference: 'Preferência do sistema',
    fontSize: 'Tamanho da fonte',
    highContrast: 'Alto contraste',
    reduceMotion: 'Reduzir movimento',
  },

  // Errors
  errors: {
    generic: 'Ocorreu um erro. Por favor, tente novamente.',
    network: 'Problema de conexão. Verifique sua internet.',
    timeout: 'A solicitação demorou muito. Por favor, tente novamente.',
    notFound: 'Recurso não encontrado.',
    unauthorized: 'Você não está autorizado a realizar esta ação.',
    forbidden: 'Acesso negado.',
    serverError: 'Erro no servidor. Por favor, tente novamente mais tarde.',
    maintenance: 'Estamos em manutenção. Volte em breve.',
    rateLimit: 'Você fez muitas solicitações. Por favor, aguarde antes de tentar novamente.',
    postCreateFailed: 'Falha ao criar post. Por favor, tente novamente.',
    postDeleteFailed: 'Falha ao excluir post. Por favor, tente novamente.',
    likeFailed: 'Falha ao processar sua curtida. Por favor, tente novamente.',
    repostFailed: 'Falha ao processar seu repost. Por favor, tente novamente.',
    bookmarkFailed: 'Falha ao salvar o post. Por favor, tente novamente.',
    followFailed: 'Falha ao seguir o usuário. Por favor, tente novamente.',
    uploadFailed: 'Falha no upload. Por favor, tente novamente.',
    loginFailed: 'Falha no login. Por favor, verifique suas credenciais.',
    registrationFailed: 'Falha no cadastro. Por favor, tente novamente.',
  },

  // Success messages
  success: {
    postCreated: 'Post criado com sucesso!',
    postDeleted: 'Post excluído com sucesso!',
    postUpdated: 'Post atualizado com sucesso!',
    profileUpdated: 'Perfil atualizado com sucesso!',
    passwordChanged: 'Senha alterada com sucesso!',
    emailChanged: 'Email alterado com sucesso!',
    usernameChanged: 'Nome de usuário alterado com sucesso!',
    accountDeleted: 'Conta excluída com sucesso.',
    followSuccess: 'Você começou a seguir {{user}}.',
    unfollowSuccess: 'Você deixou de seguir {{user}}.',
    likeSuccess: 'Post curtido!',
    unlikeSuccess: 'Curtida removida!',
    repostSuccess: 'Post repostado!',
    unRepostSuccess: 'Repost removido!',
    bookmarkSuccess: 'Post salvo!',
    unbookmarkSuccess: 'Post removido dos salvos!',
  },

  // Accessibility
  accessibility: {
    skipToContent: 'Pular para o conteúdo principal',
    closeMenu: 'Fechar menu',
    openMenu: 'Abrir menu',
    toggleTheme: 'Alternar tema',
    languageSelector: 'Seletor de idioma',
    navigation: 'Navegação',
    mainContent: 'Conteúdo principal',
    footer: 'Rodapé',
    backToTop: 'Voltar ao topo',
    loadMore: 'Carregar mais conteúdo',
    dismiss: 'Descartar',
    alert: 'Alerta',
    success: 'Sucesso',
    error: 'Erro',
    info: 'Informação',
    warning: 'Aviso',
  },

  // Date/Time formatting
  dateTime: {
    justNow: 'agora mesmo',
    secondsAgo: '{{count}} segundo{{plural}} atrás',
    minutesAgo: '{{count}} minuto{{plural}} atrás',
    hoursAgo: '{{count}} hora{{plural}} atrás',
    daysAgo: '{{count}} dia{{plural}} atrás',
    weeksAgo: '{{count}} semana{{plural}} atrás',
    monthsAgo: '{{count}} mês{{plural}} atrás',
    yearsAgo: '{{count}} ano{{plural}} atrás',
    todayAt: 'hoje às {{time}}',
    yesterdayAt: 'ontem às {{time}}',
    dateFormat: '{{day}}/{{month}}/{{year}}',
    timeFormat: '{{hours}}:{{minutes}}',
    fullDateTime: '{{day}} de {{month}} de {{year}} às {{time}}',
  },
};

/**
 * Helper function for pluralization
 * @param count Number of items
 * @param singular Singular form
 * @param plural Plural form
 * @returns Proper pluralized string
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Format string with placeholders
 * @param template String template with {{placeholder}} syntax
 * @param replacements Object with replacement values
 * @returns Formatted string
 */
export function formatString(template: string, replacements: Record<string, string | number | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = replacements[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Get string with pluralization support
 * @param key String key
 * @param count For pluralization (optional)
 * @param replacements Replacement values (optional)
 * @returns Localized string
 */
export function getString(
  key: string,
  count?: number,
  replacements: Record<string, string | number> = {}
): string {
  // Split key by dots to navigate nested objects
  const keys = key.split('.');
  let value: any = strings;

  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      return key; // Return key if not found
    }
  }

  if (typeof value === 'string') {
    // Handle pluralization if count is provided and string contains {{plural}}
    if (count !== undefined && value.includes('{{plural}}')) {
      const parts = value.split('{{plural}}');
      if (parts.length === 2) {
        value = parts[0] + (count !== 1 ? 's' : '') + parts[1];
      }
    }

    // Apply replacements
    return formatString(value, { count, ...replacements });
  }

  return key;
}