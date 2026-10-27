import Swal from 'sweetalert2';

export function showError(title, text) {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ea580c',
    background: '#ffffff',
    color: '#0f172a',
  });
}

export function showSuccess(title, text) {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ea580c',
    background: '#ffffff',
    color: '#0f172a',
  });
}

export function showAlert({ title, text, icon = 'info' }) {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: 'OK',
    confirmButtonColor: '#ea580c',
    background: '#ffffff',
    color: '#0f172a',
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
    confirmButtonColor: '#ea580c',
    cancelButtonColor: '#64748b',
    background: '#ffffff',
    color: '#0f172a',
  }).then((result) => result.isConfirmed);
}

export function showAlreadyAttemptedQuizAlert() {
  return Swal.fire({
    title: 'Already Attempted',
    text: 'You have already attempted this quiz. Check your results.',
    icon: 'info',
    confirmButtonText: 'OK',
    confirmButtonColor: '#ea580c',
    background: '#ffffff',
    color: '#0f172a',
  });
}
