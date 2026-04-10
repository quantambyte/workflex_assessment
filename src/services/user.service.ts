import { Role, Region, User } from "@/src/types";

class UserService {
  private users: User[] = [
    {
      id: 1,
      name: "John Admin",
      email: "admin@hooli.com",
      role: Role.HR_ADMIN,
      region: Region.GLOBAL,
      isMfaEnabled: false,
    },
    {
      id: 2,
      name: "Jane UK Manager",
      email: "jane.uk@massivedynamic.com",
      role: Role.REGIONAL_MANAGER,
      region: Region.UK,
      isMfaEnabled: false,
    },
    {
      id: 3,
      name: "Bob DE Manager",
      email: "bob.de@massivedynamic.com",
      role: Role.REGIONAL_MANAGER,
      region: Region.DE,
      isMfaEnabled: false,
    },
    {
      id: 4,
      name: "Alice Employee",
      email: "alice@hooli.com",
      role: Role.EMPLOYEE,
      region: Region.US,
      isMfaEnabled: false,
    },
  ];

  async getAllUsers(regionFilter?: Region): Promise<User[]> {
    if (regionFilter && regionFilter !== Region.GLOBAL) {
      return this.users.filter((u) => u.region === regionFilter);
    }
    return this.users;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email);
  }

  async createUser(userData: {
    name: string;
    email: string;
    role?: Role;
    region?: Region;
  }): Promise<User> {
    const newUser = {
      id: this.users.length + 1,
      ...userData,
      role: userData.role || Role.EMPLOYEE,
      region: userData.region || Region.US,
      isMfaEnabled: false,
    };
    this.users.push(newUser);
    return newUser;
  }

  async findOrCreateUser(userData: {
    name: string;
    email: string;
    role?: Role;
    region?: Region;
  }): Promise<User> {
    let user = this.users.find((u) => u.email === userData.email);
    if (!user) {
      user = await this.createUser(userData);
    }
    return user;
  }

  async updateUser(id: number, data: Partial<User>) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...data };
      return this.users[index];
    }
    return null;
  }

  async bulkCreateUsers(
    usersData: { name: string; email: string; role?: Role; region?: Region }[],
  ): Promise<User[]> {
    const newUsers = usersData.map((data, index) => ({
      id: this.users.length + index + 1,
      ...data,
      role: data.role || Role.EMPLOYEE,
      region: data.region || Region.US,
      isMfaEnabled: false,
    }));
    this.users.push(...newUsers);
    return newUsers;
  }
}

export const userService = new UserService();
