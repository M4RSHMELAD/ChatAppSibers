import { 
    Box, 
    VStack, 
    Text, 
    Input, 
    Button, 
    Badge,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    HStack } from "@chakra-ui/react";
import { useState } from "react";

export const UserList = ({ allUsers, currentUser, removeUser, makeAdmin }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    console.log("UserList - currentUser:", currentUser);
    console.log("UserList - allUsers:", allUsers);

    const filteredUsers = allUsers.filter(user =>
        user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.chatRoom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAdmin = currentUser?.role === 'Admin';
    console.log("UserList - isAdmin:", isAdmin);

    const handleRemoveUser = (user) => {
        setSelectedUser(user);
        onOpen();
    };

    const confirmRemove = () => {
        if (selectedUser) {
            removeUser(selectedUser.userName);
            onClose();
            setSelectedUser(null);
        }
    };

    const handleMakeAdmin = (userName) => {
        makeAdmin(userName);
    };

    return(
        <Box width="350px" p={4} bg="white" borderRadius="lg" shadow="md">
            <VStack spacing={4} align="stretch">
                <Text fontSize="xl" fontWeight="bold">
                    👥 Пользователи ({allUsers.length})
                </Text>

                <Input
                    placeholder="Поиск по имени или комнате..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                />

                <div className="flex justify-between text-sm text-gray-600">
                    <span>Админов: {allUsers.filter(u => u.role === 'Admin').length}</span>
                    <span>Комнат: {new Set(allUsers.map(u => u.chatRoom)).size}</span>
                </div>

                <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                    {filteredUsers.map(user => (
                        <Box
                            key={`${user.userName}-${user.chatRoom}`}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            bg={user.userName === currentUser?.userName ? "blue.50" : "white"}
                            borderColor={user.userName === currentUser?.userName ? "blue.200" : "gray.200"}
                        >
                            <VStack align="start" spacing={1}>
                                <div className="flex items-center gap-2">
                                    <Text fontWeight="bold" fontSize="sm">
                                        {user.userName}
                                    </Text>
                                    {user.role === 'Admin' && " 👑"}
                                </div>
                                
                                <Badge 
                                    colorScheme={user.role === 'Admin' ? "red" : "gray"}
                                    fontSize="xs"
                                >
                                    {user.role === 'Admin' ? "Админ" : "Участник"}
                                </Badge>
                                
                                <Text fontSize="xs" color="gray.600">
                                    Комната: <strong>#{user.chatRoom}</strong>
                                </Text>
                                
                                <Text fontSize="xs" color="gray.400">
                                    Роль в данных: "{user.role}"
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                    Текущий пользователь роль: "{currentUser?.role}"
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                    isAdmin: {isAdmin ? "true" : "false"}
                                </Text>
                                
                                {isAdmin && user.userName !== currentUser?.userName && (
                                    <HStack spacing={1} mt={1}>
                                        {user.role !== 'Admin' && (
                                            <Button
                                                size="xs"
                                                colorScheme="green"
                                                onClick={() => handleMakeAdmin(user.userName)}
                                            >
                                                Сделать админом
                                            </Button>
                                        )}
                                        <Button
                                            size="xs"
                                            colorScheme="red"
                                            onClick={() => handleRemoveUser(user)}
                                        >
                                            Удалить
                                        </Button>
                                    </HStack>
                                )}
                            </VStack>
                        </Box>
                    ))}
                </VStack>
            </VStack>

            <Modal isOpen={isOpen} onClose={onClose} size="sm">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Подтверждение удаления</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <Text mb={4}>
                            Вы уверены, что хотите удалить пользователя{" "}
                            <strong>{selectedUser?.userName}</strong> из комнаты{" "}
                            <strong>{selectedUser?.chatRoom}</strong>?
                        </Text>
                        <div className="flex gap-2">
                            <Button colorScheme="red" onClick={confirmRemove} flex={1}>
                                Удалить
                            </Button>
                            <Button variant="outline" onClick={onClose} flex={1}>
                                Отмена
                            </Button>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};