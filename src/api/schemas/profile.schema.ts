import { z } from 'zod'

const parseDdMmYyyy = (dateString: string) => {
    const parts = dateString.split('-')

    if (parts.length !== 3) {
        return null
    }

    const [dayRaw, monthRaw, yearRaw] = parts
    const day = Number(dayRaw)
    const month = Number(monthRaw)
    const year = Number(yearRaw)

    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
        return null
    }

    const parsed = new Date(Date.UTC(year, month - 1, day))

    if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
    ) {
        return null
    }

    return parsed
}

const isAgeBetween5And149 = (dateString: string) => {
    const birthDate = parseDdMmYyyy(dateString)

    if (!birthDate) {
        return false
    }

    const today = new Date()
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear()

    const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth()
    const dayDiff = today.getUTCDate() - birthDate.getUTCDate()

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age -= 1
    }

    return age >= 5 && age < 150
}

const toIsoDate = (dateString: string) => {
    const [day, month, year] = dateString.split('-')
    return `${year}-${month}-${day}`
}

export const createProfileSchema = z.object({
    cnic: z
        .string()
        .trim()
        .regex(/^\d{13}$/, 'CNIC must be exactly 13 digits without dashes'),
    dateOfBirth: z
        .string()
        .trim()
        .regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be in DD-MM-YYYY format')
        .refine(
            isAgeBetween5And149,
            'Date of birth must be at least 5 years old and less than 150 years old',
        )
        .transform(toIsoDate)
        .optional(),
    gender: z
        .enum(['male', 'female', 'other', 'prefer_not_to_say'])
        .optional(),
    city: z.string().trim().max(80).optional(),
    address: z.string().trim().optional(),
})

export const editProfileSchema = z
    .object({
        cnic: z
            .string()
            .trim()
            .regex(/^\d{13}$/, 'CNIC must be exactly 13 digits without dashes')
            .optional(),
        dateOfBirth: z
            .string()
            .trim()
            .regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be in DD-MM-YYYY format')
            .refine(
                isAgeBetween5And149,
                'Date of birth must be at least 5 years old and less than 150 years old',
            )
            .transform(toIsoDate)
            .optional(),
        gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
        city: z.string().trim().max(80).optional(),
        address: z.string().trim().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field is required to update profile',
    })

export const selectProfileTeamSchema = z.object({
    teamId: z.string().uuid('Team ID must be a valid UUID'),
})

export type CreateProfileInput = z.infer<typeof createProfileSchema>
export type EditProfileInput = z.infer<typeof editProfileSchema>
export type SelectProfileTeamInput = z.infer<typeof selectProfileTeamSchema>