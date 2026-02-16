import {executeSQL} from '../client';
import {Donation, CreateDonationInput} from '../../domain/models';

function mapRowToDonation(row: Record<string, unknown>): Donation {
  return {
    id: row.id as number,
    amountCents: row.amountCents as number,
    createdAt: row.createdAt as number,
    applicantId: row.applicantId as number | null,
  };
}

export const donationRepository = {
  async getAll(): Promise<Donation[]> {
    const result = await executeSQL('SELECT * FROM donations ORDER BY createdAt DESC');
    return result.rows.map(mapRowToDonation);
  },

  async getById(id: number): Promise<Donation | null> {
    const result = await executeSQL('SELECT * FROM donations WHERE id = ?', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return mapRowToDonation(result.rows[0]);
  },

  async getTotalAmount(): Promise<number> {
    const result = await executeSQL('SELECT COALESCE(SUM(amountCents), 0) as total FROM donations');
    return (result.rows[0]?.total as number) || 0;
  },

  async getGeneralTotalAmount(): Promise<number> {
    const result = await executeSQL(
      'SELECT COALESCE(SUM(amountCents), 0) as total FROM donations WHERE applicantId IS NULL',
    );
    return (result.rows[0]?.total as number) || 0;
  },

  async create(input: CreateDonationInput): Promise<Donation> {
    const createdAt = Date.now();
    const result = await executeSQL(
      'INSERT INTO donations (amountCents, createdAt, applicantId) VALUES (?, ?, ?)',
      [input.amountCents, createdAt, input.applicantId ?? null],
    );
    return {
      id: result.insertId!,
      amountCents: input.amountCents,
      createdAt,
      applicantId: input.applicantId ?? null,
    };
  },

  async deleteAll(): Promise<void> {
    await executeSQL('DELETE FROM donations');
  },
};
