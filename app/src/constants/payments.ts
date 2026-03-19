export interface PaymentData {
  id: string;
  paymentType: string;
  milestone: string;
  vendorClient: {
    name: string;
    avatar: string;
  };
  amount: string;
  dueDate: string;
  status: 'pending' | 'completed';
}

export const SAMPLE_PAYMENTS_DATA: PaymentData[] = [
  {
    id: '1',
    paymentType: 'Client Payment',
    milestone: 'Milestone #3: Layout',
    vendorClient: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    amount: '₹50,000',
    dueDate: '09/05/2025',
    status: 'pending',
  },
  {
    id: '2',
    paymentType: 'Client Payment',
    milestone: 'Milestone #3: Layout',
    vendorClient: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    amount: '₹50,000',
    dueDate: '09/05/2025',
    status: 'pending',
  },
  {
    id: '3',
    paymentType: 'Client Payment',
    milestone: 'Milestone #3: Layout',
    vendorClient: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    amount: '₹50,000',
    dueDate: '09/05/2025',
    status: 'pending',
  },
  {
    id: '4',
    paymentType: 'Client Payment',
    milestone: 'Milestone #3: Layout',
    vendorClient: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    amount: '₹50,000',
    dueDate: '09/05/2025',
    status: 'pending',
  },
  {
    id: '5',
    paymentType: 'Client Payment',
    milestone: 'Milestone #3: Layout',
    vendorClient: {
      name: 'Ram Kapoor',
      avatar: '/avatars/ram-kapoor.jpg',
    },
    amount: '₹50,000',
    dueDate: '09/05/2025',
    status: 'completed',
  },
];
