const translations = {
  'client': 'Служба строительного контроля (заказчик)',
  'foreman': 'Прораб',
  'inspector': 'Инспектор',

  'active': 'Активен',
  'pending': 'В ожидании',
  'in_progress': 'В процессе',
  'pending_verification': 'На верификации',
  'completed': 'Завершено',
  'verified': 'Проверено',
  'resolved': 'Устранено',
  'open': 'Открыто',
  'processing': 'В обработке',
  'failed': 'Ошибка',
};

export const translate = (word) => {
  return translations[word] || word;
};
