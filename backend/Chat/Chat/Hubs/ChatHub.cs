using Chat.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Chat.Hubs;

public interface IChatClient 
{
    public Task ReceiveMessage(string userName, string message);
    public Task UsersListUpdated(List<UserInfo> users);
    public Task UserRemoved(string reason);
    public Task UserRoleUpdated(string userName, string newRole);
}
public class ChatHub : Hub<IChatClient>
{
    private readonly IDistributedCache _cache;
    
    private static readonly Dictionary<string, UserConnection> ConnectedUsers = new();

    public ChatHub(IDistributedCache cache)
    {
        _cache = cache;
    }
    
    public async Task JoinChat(UserConnection connection)
    {
        UserConnection userConnection = connection;
    
        if (ConnectedUsers.Count == 0 || connection.UserName.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            userConnection = connection with { Role = "Admin" };
        }
    
        ConnectedUsers[Context.ConnectionId] = userConnection;

        await Groups.AddToGroupAsync(Context.ConnectionId, userConnection.ChatRoom);

        var stringConnection = JsonSerializer.Serialize(userConnection);
        await _cache.SetStringAsync(Context.ConnectionId, stringConnection);

        await Clients
            .Group(userConnection.ChatRoom)
            .ReceiveMessage("Admin", $"{userConnection.UserName} присоединился к чату");

        await UpdateAllUsersList();
    }

    public async Task SendMessage(string message)
    {
        var stringConnection = await _cache.GetAsync(Context.ConnectionId);

        var connection = JsonSerializer.Deserialize<UserConnection>(stringConnection);

        if (connection is not null)
        {
            await Clients
                .Group(connection.ChatRoom)
                .ReceiveMessage(connection.UserName, message);
        }
    }
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var stringConnection = await _cache.GetAsync(Context.ConnectionId);
        var connection = JsonSerializer.Deserialize<UserConnection>(stringConnection);

        if (connection is not null)
        {
            await _cache.RemoveAsync(Context.ConnectionId);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, connection.ChatRoom);

            await Clients
                .Group(connection.ChatRoom)
                .ReceiveMessage("Admin", $"{connection.UserName} покинул чат");
            
            await UpdateAllUsersList();

        }

        await base.OnDisconnectedAsync(exception);
    }
    
    public List<UserInfo> GetAllUsers()
    {
        return ConnectedUsers.Values
            .Select(user => new UserInfo(user.UserName, user.Role, user.ChatRoom))
            .ToList();
    }
    public List<UserInfo> SearchUsers(string searchTerm)
    {
        var results = ConnectedUsers.Values
            .Where(user => user.UserName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
            .Select(user => new UserInfo(user.UserName, user.Role, user.ChatRoom))
            .Take(50)
            .ToList();

        return results;
    }
    
    public async Task RemoveUser(string targetUserName)
    {
        if (!ConnectedUsers.TryGetValue(Context.ConnectionId, out var currentUser))
            return;

        if (currentUser.Role != "Admin")
        {
            await Clients.Caller.ReceiveMessage("System", "Недостаточно прав для удаления пользователей");
            return;
        }

        if (targetUserName == currentUser.UserName)
        {
            await Clients.Caller.ReceiveMessage("System", "Нельзя удалить себя");
            return;
        }

        var targetUser = ConnectedUsers.FirstOrDefault(u => u.Value.UserName == targetUserName);
        if (targetUser.Value == null) return;

        ConnectedUsers.Remove(targetUser.Key);

        await Groups.RemoveFromGroupAsync(targetUser.Key, targetUser.Value.ChatRoom);

        await Clients.Group(targetUser.Value.ChatRoom)
            .ReceiveMessage("System", $"{targetUserName} был удален из чата");

        await Clients.Client(targetUser.Key)
            .UserRemoved("Вас удалили из чата");

        await UpdateAllUsersList();
    }

    private async Task UpdateAllUsersList()
    {
        var allUsersInfo = ConnectedUsers.Values
            .Select(user => new UserInfo(user.UserName, user.Role, user.ChatRoom))
            .ToList();

        await Clients.All.UsersListUpdated(allUsersInfo);
    }
    public async Task MakeAdmin(string targetUserName)
    {
        if (!ConnectedUsers.TryGetValue(Context.ConnectionId, out var currentUser) || 
            currentUser.Role != "Admin")
            return;

        var targetUser = ConnectedUsers.FirstOrDefault(u => u.Value.UserName == targetUserName);
        if (targetUser.Value == null) return;

        var updatedUser = targetUser.Value with { Role = "Admin" };
        ConnectedUsers[targetUser.Key] = updatedUser;

        var updatedConnection = JsonSerializer.Serialize(updatedUser);
        await _cache.SetStringAsync(targetUser.Key, updatedConnection);

        await Clients.All.UserRoleUpdated(targetUserName, "Admin");
    
        await UpdateAllUsersList();
    
        await Clients.Group(updatedUser.ChatRoom)
            .ReceiveMessage("System", $"{targetUserName} теперь администратор");
    }
}