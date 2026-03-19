export type TUnit = {
  id: string;
  name: string;
  displayName: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
};

export type TCreateUnitFormData = {
  name: string;
  displayName: string;
};

export type TUpdateUnitFormData = Partial<TCreateUnitFormData> & {
  status?: 'ACTIVE' | 'INACTIVE';
};
