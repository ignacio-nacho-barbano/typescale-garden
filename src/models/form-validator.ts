export interface FormValidator<T> {
	validator: RegExp | ((value: T) => boolean);
	errorMessage: string | ((value: T) => string);
}
