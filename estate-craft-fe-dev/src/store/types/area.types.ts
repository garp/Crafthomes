export type TArea = {
  id: string;
  sNo: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TCreateAreaFormData = {
  name: string;
};

export type TUpdateAreaFormData = Partial<TCreateAreaFormData>;
