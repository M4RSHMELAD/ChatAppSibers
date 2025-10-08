import { Button, CloseButton, Heading, Input } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Message } from "./Message";

export const Chat = ({ messages, chatRoom, sendMessage, closeChat, allUsers, currentUser, removeUser }) => {
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSendMessage = () => {
        sendMessage(message);
        setMessage("");
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && message.trim()) {
            onSendMessage();
        }
    };

    const isAdmin = currentUser?.role === 'Admin';

    return (
        <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-row justify-between mb-4">
                <div>
                    <Heading size="lg">{chatRoom} {isAdmin && " 👑"}</Heading>
                    <div className="text-sm text-gray-600 mt-1">
                        Пользователей онлайн: {allUsers.length}
                        {isAdmin && " • Вы администратор"}
                    </div>
                </div>
                <CloseButton onClick={closeChat} />
            </div>

            <div className="flex flex-col overflow-auto scroll-smooth h-80 gap-3 pb-3 mb-4">
                {messages.map((messageInfo, index) => (
                    <Message messageInfo={messageInfo} key={index} />
                ))}
                <span ref={messagesEndRef} />
            </div>
            
            <div className="flex gap-3">
                <Input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                />
                <Button colorScheme="blue" onClick={onSendMessage}>
                    Отправить
                </Button>
            </div>
        </div>
    );
};
