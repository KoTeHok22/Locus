const translations = {
  'client': 'Заказчик',
  'foreman': 'Прораб',
  'inspector': 'Инспектор',

  'active': 'Активен',
  'pending': 'В ожидании',
  'completed': 'Завершено',
  'verified': 'Проверено',
  'open': 'Открыто',
  'processing': 'В обработке',
  'failed': 'Ошибка',
};

export const translate = (word) => {
  return translations[word] || word;
};