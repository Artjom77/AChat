import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SubscriptionTier } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create new user
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username } });
  }

  /**
   * Update user
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  /**
   * Update user subscription
   */
  async updateSubscription(
    userId: string,
    tier: SubscriptionTier,
    expiresAt?: Date,
  ): Promise<User> {
    return await this.update(userId, {
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt,
    });
  }

  /**
   * Update user public key (for E2E encryption)
   */
  async updatePublicKey(userId: string, publicKey: string): Promise<User> {
    return await this.update(userId, { publicKey });
  }

  /**
   * Update AI preferences
   */
  async updateAiPreferences(userId: string, preferences: any): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.update(userId, {
      aiPreferences: {
        ...user.aiPreferences,
        ...preferences,
      },
    });
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastSeenAt: new Date(),
    });
  }

  /**
   * Search users by username or display name
   */
  async search(query: string, limit: number = 20): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .orWhere('user.displayName ILIKE :query', { query: `%${query}%` })
      .limit(limit)
      .getMany();
  }

  /**
   * Check if user has premium subscription
   */
  async hasPremium(userId: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }

    if (user.subscriptionTier === SubscriptionTier.FREE) {
      return false;
    }

    // Check if subscription is expired
    if (
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt < new Date()
    ) {
      // Downgrade to free
      await this.updateSubscription(userId, SubscriptionTier.FREE);
      return false;
    }

    return true;
  }
}
