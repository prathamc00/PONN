import Swal, { type SweetAlertIcon } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

type AlertOptions = {
  title: string;
  text?: string;
  icon?: SweetAlertIcon;
};

type ConfirmOptions = {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: SweetAlertIcon;
};

type PromptOptions = {
  title: string;
  text?: string;
  inputLabel?: string;
  placeholder?: string;
  inputValue?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: 'text' | 'email' | 'password' | 'number' | 'textarea';
};

const dialog = Swal.mixin({
  customClass: {
    popup: 'ponn-swal-popup',
    title: 'ponn-swal-title',
    htmlContainer: 'ponn-swal-text',
    confirmButton: 'ponn-swal-confirm',
    cancelButton: 'ponn-swal-cancel',
    input: 'ponn-swal-input',
    validationMessage: 'ponn-swal-validation',
  },
  buttonsStyling: false,
  backdrop: 'rgba(2, 0, 20, 0.8)',
  heightAuto: false,
  reverseButtons: true,
  focusCancel: true,
  allowOutsideClick: true,
});

export async function showAlert({ title, text, icon = 'info' }: AlertOptions): Promise<void> {
  await dialog.fire({
    icon,
    title,
    text,
    confirmButtonText: 'OK',
  });
}

export async function showSuccess(title: string, text?: string): Promise<void> {
  await showAlert({ title, text, icon: 'success' });
}

export async function showError(title: string, text?: string): Promise<void> {
  await showAlert({ title, text, icon: 'error' });
}

export async function showConfirm({
  title,
  text,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon = 'warning',
}: ConfirmOptions): Promise<boolean> {
  const result = await dialog.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
}

export async function showPrompt({
  title,
  text,
  inputLabel,
  placeholder,
  inputValue,
  confirmText = 'Submit',
  cancelText = 'Cancel',
  inputType = 'text',
}: PromptOptions): Promise<string | null> {
  const result = await dialog.fire({
    title,
    text,
    input: inputType,
    inputLabel,
    inputPlaceholder: placeholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    inputValidator: (value) => {
      if (value == null || value.trim() === '') {
        return 'This field is required.';
      }
      return undefined;
    },
  });

  if (!result.isConfirmed || !result.value) {
    return null;
  }
  return String(result.value);
}

export async function showAlreadyAttemptedQuizAlert(): Promise<void> {
  await showAlert({
    title: 'Already Attempted',
    text: 'You have already completed this quiz.',
    icon: 'warning',
  });
}
