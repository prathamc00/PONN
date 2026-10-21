import Swal from 'sweetalert2';

export function showError(title, text) {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#1e3a2f',
    background: '#fff8f5',
    color: '#1e1b19',
  });
}

export function showSuccess(title, text) {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#1e3a2f',
    background: '#fff8f5',
    color: '#1e1b19',
  });
}

export function showAlert({ title, text, icon = 'info' }) {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: 'OK',
    confirmButtonColor: '#1e3a2f',
    background: '#fff8f5',
    color: '#1e1b19',
  });
}

export function showConfirm({ title, text, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: '#1e3a2f',
    cancelButtonColor: '#9d4225',
    background: '#fff8f5',
    color: '#1e1b19',
  }).then((result) => result.isConfirmed);
}

export function showAlreadyAttemptedQuizAlert() {
  return Swal.fire({
    title: 'Already Attempted',
    text: 'You have already attempted this quiz. Check your results.',
    icon: 'info',
    confirmButtonText: 'OK',
    confirmButtonColor: '#1e3a2f',
    background: '#fff8f5',
    color: '#1e1b19',
  });
}
