import { HubConnectionBuilder } from "@microsoft/signalr";
import { WaitingRoom } from "./components/WaitingRoom";
import { useState, useRef, useEffect } from "react";
import { Chat } from "./components/Chat";
import { UserList } from "./components/UserList";

function App() {
    const [connection, setConnection] = useState(null);
    const [chatRoom, setChatRoom] = useState("");
    const [messages, setMessages] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    
    const currentUserRef = useRef();
    
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    const joinChat = async (userName, chatRoom) => {
        var connection = new HubConnectionBuilder()
            .withUrl("http://localhost:5022/chat")
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveMessage", (userName, message) => {
            setMessages((messages) => [...messages, { userName, message }]);
        });
        
        connection.on("UsersListUpdated", (usersList) => {
            console.log("UsersListUpdated:", usersList);
            setAllUsers(usersList);
            
            const updatedCurrentUser = usersList.find(user => user.userName === userName);
            if (updatedCurrentUser && currentUserRef.current) {
                setCurrentUser(prev => ({ 
                    ...prev, 
                    role: updatedCurrentUser.role 
                }));
            }
        });
        
        connection.on("UserRemoved", (reason) => {
            alert(reason);
            connection.stop();
            setConnection(null);
            setCurrentUser(null);
            setAllUsers([]);
            setMessages([]);
        });

        connection.on("UserRoleUpdated", (userName, newRole) => {
            console.log("UserRoleUpdated:", userName, newRole);
            setAllUsers(prevUsers => 
                prevUsers.map(user => 
                    user.userName === userName 
                        ? { ...user, role: newRole }
                        : user
                )
            );
            
            if (currentUserRef.current && currentUserRef.current.userName === userName) {
                setCurrentUser(prev => ({ ...prev, role: newRole }));
            }
        });

        try {
            await connection.start();
            await connection.invoke("JoinChat", { userName, chatRoom });
            
            const initialUser = { userName, chatRoom };
            setCurrentUser(initialUser);
            currentUserRef.current = initialUser;
            
            setConnection(connection);
            setChatRoom(chatRoom);

            const users = await connection.invoke("GetAllUsers");
            console.log("Initial users:", users);
            setAllUsers(users);
            
            const currentUserData = users.find(user => user.userName === userName);
            if (currentUserData) {
                setCurrentUser(prev => ({ 
                    ...prev, 
                    role: currentUserData.role 
                }));
                console.log("Current user role:", currentUserData.role);
            }
            
        } catch (error) {
            console.log(error);
        }
    };

    const sendMessage = (message) => {
        if (connection) {
            connection.invoke("SendMessage", message);
        }
    };

    const removeUser = async (userName) => {
        if (connection) {
            await connection.invoke("RemoveUser", userName);
        }
    };
    
    const makeAdmin = async (userName) => {
        if (connection) {
            await connection.invoke("MakeAdmin", userName);
        }
    };

    const closeChat = async () => {
        if (connection) {
            await connection.stop();
        }
        setConnection(null);
        setCurrentUser(null);
        setAllUsers([]);
        setMessages([]);
    };

    console.log("Current user in render:", currentUser);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            {connection ? (
                <div className="flex gap-4 w-full max-w-6xl">
                    {/* Чат */}
                    <Chat 
                        messages={messages} 
                        chatRoom={chatRoom} 
                        sendMessage={sendMessage} 
                        closeChat={closeChat}
                        allUsers={allUsers}
                        currentUser={currentUser}
                        removeUser={removeUser}
                    />
                    
                    {/* Список пользователей */}
                    <UserList 
                        allUsers={allUsers}
                        currentUser={currentUser}
                        removeUser={removeUser}
                        makeAdmin={makeAdmin}
                    />
                </div>
            ) : (
                <WaitingRoom joinChat={joinChat}/>
            )}
        </div>
    );
}

export default App;