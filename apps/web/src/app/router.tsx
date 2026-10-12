import { createBrowserRouter } from 'react-router';
import { ManageCourtsPage } from '@/features/admin/courts/manage-courts-page';
import { DailyBookingsPage } from '@/features/admin/day/daily-bookings-page';
import { HomeRedirect } from '@/features/auth/guards/home-redirect';
import { RequireRole } from '@/features/auth/guards/require-role';
import { RequireSession } from '@/features/auth/guards/require-session';
import { LoginPage } from '@/features/auth/login/login-page';
import { BookCourtPage } from '@/features/bookings/book/book-court-page';
import { MyBookingsPage } from '@/features/bookings/my-bookings/my-bookings-page';
import { PATHS } from '@/paths';
import { AppLayout } from './layout/app-layout';
import { RouteError } from './route-error';

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      { path: PATHS.login, element: <LoginPage /> },
      {
        element: <RequireSession />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <RequireRole role="USER" />,
                children: [
                  { path: PATHS.book, element: <BookCourtPage /> },
                  { path: PATHS.myBookings, element: <MyBookingsPage /> },
                ],
              },
              {
                element: <RequireRole role="ADMIN" />,
                children: [
                  { path: PATHS.adminCourts, element: <ManageCourtsPage /> },
                  { path: PATHS.adminDay, element: <DailyBookingsPage /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <HomeRedirect /> },
    ],
  },
]);
