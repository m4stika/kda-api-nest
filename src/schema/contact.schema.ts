import { z } from 'zod';
/*
export class CreateContactRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export class ContactResponse extends CreateContactRequest {
  id: number;
}

export class UpdateContactRequest extends ContactResponse {}

export class SearchContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  page: number;
  size: number;
}
 */
export class ContactValidation {
  private static readonly baseSchema = z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100).nullish(),
    email: z.string().min(1).max(50).email().nullish(),
    phone: z.string().min(1).max(20).nullish(),
  });

  static readonly CREATE = this.baseSchema;

  static readonly UPDATE = this.baseSchema.extend({
    id: z.number().positive(),
  });

  static readonly SEARCH = z.object({
    name: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    page: z.number().min(1).positive(),
    size: z.number().min(1).positive(),
  });
}

export type CreateContactRequest = z.infer<typeof ContactValidation.CREATE>;
export type UpdateContactRequest = z.infer<typeof ContactValidation.UPDATE>;
export type ContactResponse = z.infer<typeof ContactValidation.UPDATE>;
export type SearchContactRequest = z.infer<typeof ContactValidation.SEARCH>;
