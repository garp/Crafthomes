import { validate as validateUuid } from 'uuid';

export const UUID = (value, helpers) => {
	if (!validateUuid(value)) {
		return helpers.error('Invalid UUID!');
	}
	return value;
};

export const pseudo = 'pseudo';
