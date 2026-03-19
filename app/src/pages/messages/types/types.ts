export interface Message {
  id: number;
  date: string;
  sender: string;
  senderInitial: string;
  type: string;
  project: string;
  messageSnippet: string;
  isRead: boolean;
}

export interface MessageCardProps {
  message: Message;
}
