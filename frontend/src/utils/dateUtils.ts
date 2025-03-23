export const formatDate = (dateString: string): string => {
  if (!dateString) {
    return '-';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('Invalid date string:', dateString);
      return '-';
    }
    
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return '-';
  }
}; 