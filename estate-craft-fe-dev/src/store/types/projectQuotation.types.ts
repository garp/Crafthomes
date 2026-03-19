export type TQuotationItem = {
  id: string;
  sNo: number;
  name: string;
  quantity: number;
  price: number;
  description: string;
  total: number;
  quotationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string | null;
};

export type TQuotationItemForm = {
  masterItemId: string;
  quantity: number;
  discount: number;
  total: number;
  mrp?: number; // Optional editable MRP (unit price), defaults to product.mrp if not set
  gst?: number; // GST % per item, default 18
  area?: string | null; // Display name (from areaRef or legacy)
  areaId?: string | null; // FK to Area
  unitId?: string | null;
  attachmentId?: string | null;
  attachmentUrl?: string | null; // For display when just uploaded (before save)
};

// API Response structure for quotation items
export type TQuotationItemResponse = {
  id: string;
  discount: number;
  gst?: number;
  quantity: number;
  total: number;
  area?: string | null;
  areaId?: string | null;
  areaRef?: { id: string; name: string } | null;
  unitId?: string | null;
  attachmentId?: string | null;
  attachment?: { id: string; url: string; key?: string } | null;
  unit?: { id: string; name: string; displayName: string } | null;
  masterItem: {
    id: string;
    name: string;
    description?: string;
    mrp: number;
    primaryFile?: Array<{ key: string; url: string; type: string; name: string }>;
  };
};

export type TQuotation = {
  id: string;
  sNo: number;
  quoteId?: string;
  client: { name: string; id: string };
  startDate?: Date;
  description: string;
  totalAmount: number;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  quotationStatus?: 'PENDING' | 'COMPLETED' | 'CANCELLED'; // API uses quotationStatus
  SalesPerson?: { name: string };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  productIds?: string[]; // Legacy field, kept for backward compatibility
  name?: string;
  discount?: number;
  paidAmount?: number;
  items?: TQuotationItemForm[] | TQuotationItem[]; // Legacy format
  quotationItem?: TQuotationItemResponse[]; // Actual API response format
};
