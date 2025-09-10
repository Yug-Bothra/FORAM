import { Check, CheckCheck, Clock } from "lucide-react";

export default function MessageStatus({ message, currentUserId }) {
  if (message.sender_id !== currentUserId) return null;

  const status = message.status || "sent"; // default to "sent"

  let icon;
  switch (status) {
    case "sent":
      icon = <Check size={14} className="text-gray-400" />;
      break;
    case "delivered":
      icon = <CheckCheck size={14} className="text-gray-400" />;
      break;
    case "read":
      icon = <CheckCheck size={14} className="text-blue-500" />;
      break;
    default:
      icon = <Clock size={14} className="text-gray-400" />;
  }

  return <span className="ml-1">{icon}</span>;
}
