import Toast from 'react-native-toast-message';

type ToastPosition = 'top' | 'bottom';

export function showSuccessToast(title: string, message?: string, position: ToastPosition = 'top') {
	Toast.show({
		type: 'success',
		text1: title,
		text2: message,
		position,
	});
}

export function showErrorToast(title: string, message?: string, position: ToastPosition = 'top') {
	Toast.show({
		type: 'error',
		text1: title,
		text2: message,
		position,
	});
}

export function showInfoToast(title: string, message?: string, position: ToastPosition = 'top') {
	Toast.show({
		type: 'info',
		text1: title,
		text2: message,
		position,
	});
}


