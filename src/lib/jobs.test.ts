import { describe, it, expect } from 'vitest';
import { filterJobs, sortByNewest, formatPostedDate } from './jobs';
import type { Job } from '../types/job';

/** Creates a job fixture with overridable department and location values. */
function makeJob(
    slug: string,
    postedDate: string,
    department = 'Technology',
    location = 'Remote',
): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department,
        location,
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('filterJobs', () => {
    const jobs = [
        makeJob('finance-woodinville', '2027-01-01', 'Finance', 'Woodinville, WA, USA'),
        makeJob('finance-helsinki', '2027-01-02', 'Finance', 'Helsinki, Finland'),
        makeJob('technology-remote', '2027-01-03', 'Technology', 'Remote (US & Canada)'),
    ];

    it('filters by department or location independently', () => {
        expect(filterJobs(jobs, 'Finance', '').map((job) => job.slug)).toEqual([
            'finance-woodinville',
            'finance-helsinki',
        ]);
        expect(filterJobs(jobs, '', 'Helsinki, Finland').map((job) => job.slug)).toEqual([
            'finance-helsinki',
        ]);
    });

    it('combines department and location filters with AND', () => {
        expect(
            filterJobs(jobs, 'Finance', 'Woodinville, WA, USA').map((job) => job.slug),
        ).toEqual(['finance-woodinville']);
    });

    it('returns every job when no filters are selected', () => {
        expect(filterJobs(jobs, '', '').map((job) => job.slug)).toEqual(
            jobs.map((job) => job.slug),
        );
    });

    it('returns no jobs when the selected filters have no match', () => {
        expect(filterJobs(jobs, 'Technology', 'Helsinki, Finland')).toEqual([]);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});
