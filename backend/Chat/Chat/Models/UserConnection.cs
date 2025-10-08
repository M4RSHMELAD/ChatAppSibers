namespace Chat.Models;

public record UserConnection(string UserName, string ChatRoom, string Role = "Member")
{
    public string Role { get; set; } = Role;
}
