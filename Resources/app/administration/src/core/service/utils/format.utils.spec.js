/**
 * @sw-package framework
 */

import { fileSize, date, dateWithUserTimezone, toISODate } from 'src/core/service/utils/format.utils';

describe('src/core/service/utils/format.utils.js', () => {
    describe('filesize', () => {
        it('should convert bytes to a readable format', async () => {
            expect(fileSize(0)).toBe('0.00B');
            expect(fileSize(1018)).toBe('0.99KB');
            expect(fileSize(1023)).toBe('1.00KB');
            expect(fileSize(1024)).toBe('1.00KB');
            expect(fileSize(102400000)).toBe('97.66MB');
        });
    });

    describe('date', () => {
        const setLocale = (locale) => {
            jest.spyOn(Shopware.Application.getContainer('factory').locale, 'getLastKnownLocale').mockImplementation(
                () => locale,
            );
        };
        const setTimeZone = (timeZone) => Shopware.Store.get('session').setCurrentUser({ timeZone });

        beforeEach(async () => {
            setLocale('en-GB');
            setTimeZone('UTC');
        });

        it('should return empty string for null value', async () => {
            expect(date(null)).toBe('');
        });

        it('should convert the date correctly with timezone UTC in en-GB', async () => {
            setLocale('en-GB');
            setTimeZone('UTC');

            expect(date('2000-06-18T08:30:00.000+00:00')).toBe('18 June 2000 at 08:30');
        });

        it('should convert the date correctly with timezone UTC in en-US', async () => {
            setLocale('en-US');
            setTimeZone('UTC');

            expect(date('2000-06-18T08:30:00.000+00:00')).toBe('June 18, 2000 at 8:30 AM');
        });

        it('should convert the date correctly with timezone UTC in de-DE', async () => {
            setLocale('de-DE');
            setTimeZone('UTC');

            expect(date('2000-06-18T08:30:00.000+00:00')).toBe('18. Juni 2000 um 08:30');
        });

        it('should convert the date correctly with timezone America/New_York in en-GB', async () => {
            setLocale('en-GB');
            setTimeZone('America/New_York');

            expect(date('2000-06-18T08:30:00.000+00:00')).toBe('18 June 2000 at 04:30');
        });

        it('should convert the date correctly with timezone America/New_York in en-US', async () => {
            setLocale('en-US');
            setTimeZone('America/New_York');

            expect(date('2000-06-18T08:30:00.000+00:00')).toBe('June 18, 2000 at 4:30 AM');
        });

        it('should convert the date correctly with timezone America/New_York in de-DE', async () => {
            setLocale('de-DE');
            setTimeZone('America/New_York');

            expect(date('2000-06-18T08:30:00.000+00:00')).toBe('18. Juni 2000 um 04:30');
        });

        it('should not convert the date correctly with timezone America/New_York in de-DE', async () => {
            setLocale('de-DE');
            setTimeZone('America/New_York');

            expect(
                date('2000-06-18T08:30:00.000+00:00', {
                    skipTimezoneConversion: true,
                }),
            ).toBe('18. Juni 2000 um 08:30');
        });
    });

    describe('dateWithUserTimezone', () => {
        const setLocale = (locale) => {
            jest.spyOn(Shopware.Application.getContainer('factory').locale, 'getLastKnownLocale').mockImplementation(
                () => locale,
            );
        };
        const setTimeZone = (timeZone) => Shopware.Store.get('session').setCurrentUser({ timeZone });

        beforeEach(async () => {
            setLocale('en-GB');
            setTimeZone('UTC');
        });

        it('should convert the date correctly with timezone Pacific/Pago_Pago', async () => {
            setTimeZone('Pacific/Samoa');
            // eslint-disable-next-line no-shadow
            const date = new Date(2000, 1, 1, 11, 13, 37);

            expect(dateWithUserTimezone(date).toString()).toBe(
                'Tue Feb 01 2000 00:13:37 GMT+0000 (Coordinated Universal Time)',
            );
        });

        it('should convert the date correctly with timezone UTC as fallback', async () => {
            setTimeZone(null);
            // eslint-disable-next-line no-shadow
            const date = new Date(2000, 1, 1, 0, 13, 37);

            expect(dateWithUserTimezone(date).toString()).toBe(
                'Tue Feb 01 2000 00:13:37 GMT+0000 (Coordinated Universal Time)',
            );
        });
    });

