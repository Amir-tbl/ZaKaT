import {executeSQL} from '../client';
import {Applicant, CreateApplicantInput} from '../../domain/models';

function mapRowToApplicant(row: Record<string, unknown>): Applicant {
  return {
    id: row.id as number,
    fullName: row.fullName as string,
    city: row.city as string,
    shortStory: row.shortStory as string,
    validated: (row.validated as number) === 1,
    goalCents: row.goalCents as number,
    collectedCents: row.collectedCents as number,
  };
}

export const applicantRepository = {
  async getAll(): Promise<Applicant[]> {
    const result = await executeSQL('SELECT * FROM applicants ORDER BY id DESC');
    return result.rows.map(mapRowToApplicant);
  },

  async getValidated(): Promise<Applicant[]> {
    const result = await executeSQL(
      'SELECT * FROM applicants WHERE validated = 1 ORDER BY id DESC',
    );
    return result.rows.map(mapRowToApplicant);
  },

  async getPending(): Promise<Applicant[]> {
    const result = await executeSQL(
      'SELECT * FROM applicants WHERE validated = 0 ORDER BY id DESC',
    );
    return result.rows.map(mapRowToApplicant);
  },

  async getById(id: number): Promise<Applicant | null> {
    const result = await executeSQL('SELECT * FROM applicants WHERE id = ?', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return mapRowToApplicant(result.rows[0]);
  },

  async create(input: CreateApplicantInput): Promise<Applicant> {
    const result = await executeSQL(
      'INSERT INTO applicants (fullName, city, shortStory, validated, goalCents, collectedCents) VALUES (?, ?, ?, 0, ?, 0)',
      [input.fullName, input.city, input.shortStory, input.goalCents],
    );
    return {
      id: result.insertId!,
      fullName: input.fullName,
      city: input.city,
      shortStory: input.shortStory,
      validated: false,
      goalCents: input.goalCents,
      collectedCents: 0,
    };
  },

  async validate(id: number): Promise<void> {
    await executeSQL('UPDATE applicants SET validated = 1 WHERE id = ?', [id]);
  },

  async addCollected(id: number, amountCents: number): Promise<void> {
    await executeSQL(
      'UPDATE applicants SET collectedCents = collectedCents + ? WHERE id = ?',
      [amountCents, id],
    );
  },

  async deleteAll(): Promise<void> {
    await executeSQL('DELETE FROM applicants');
  },
};
