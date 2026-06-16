import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AddressInput, AddressItem, AdminChangeEmailRequest, AdminCreateUserRequest, AdminOkResponse, AdminOrderDetail, AdminOrderItem, AdminPutTranslationDraftsRequest, AdminSetPasswordRequest, AdminTransferAccountRequest, AdminTransferAccountResult, AdminTranslationsState, AdminUser, AdminUserDetail, AdminUserUpdate, AffiliateCreateResult, AffiliateInput, CheckSignupEmailRequest, CheckSignupEmailResult, Dashboard, DisplayFlags, DisplayFlagsUpdate, DownlineMember, GetStorefrontParams, HealthStatus, IntegrationsStatus, OrderDetail, OrderItem, OrderLookupRequest, OrderLookupResult, Placement, Profile, ProfileUpdate, PublishedTranslations, ReferredOrderItem, SearchDownlineParams, ShareLinks, ShareLinksConfig, ShareLinksUpdate, SmsSendCodeRequest, SmsSendCodeResult, SmsVerifyCodeRequest, SmsVerifyCodeResult, Storefront } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get the authenticated user's influencer profile
 */
export declare const getGetProfileUrl: () => string;
export declare const getProfile: (options?: RequestInit) => Promise<Profile>;
export declare const getGetProfileQueryKey: () => readonly ["/api/profile"];
export declare const getGetProfileQueryOptions: <TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getProfile>>>;
export type GetProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get the authenticated user's influencer profile
 */
export declare function useGetProfile<TData = Awaited<ReturnType<typeof getProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateProfileUrl: () => string;
export declare const updateProfile: (profileUpdate: ProfileUpdate, options?: RequestInit) => Promise<Profile>;
export declare const getUpdateProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
        data: BodyType<ProfileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
    data: BodyType<ProfileUpdate>;
}, TContext>;
export type UpdateProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateProfile>>>;
export type UpdateProfileMutationBody = BodyType<ProfileUpdate>;
export type UpdateProfileMutationError = ErrorType<unknown>;
export declare const useUpdateProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProfile>>, TError, {
        data: BodyType<ProfileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProfile>>, TError, {
    data: BodyType<ProfileUpdate>;
}, TContext>;
/**
 * @summary Get share link URLs rendered with the user's sponsor_id
 */
export declare const getGetShareLinksUrl: () => string;
export declare const getShareLinks: (options?: RequestInit) => Promise<ShareLinks>;
export declare const getGetShareLinksQueryKey: () => readonly ["/api/share-links"];
export declare const getGetShareLinksQueryOptions: <TData = Awaited<ReturnType<typeof getShareLinks>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getShareLinks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getShareLinks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetShareLinksQueryResult = NonNullable<Awaited<ReturnType<typeof getShareLinks>>>;
export type GetShareLinksQueryError = ErrorType<unknown>;
/**
 * @summary Get share link URLs rendered with the user's sponsor_id
 */
export declare function useGetShareLinks<TData = Awaited<ReturnType<typeof getShareLinks>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getShareLinks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update the global share-link base URLs (admin only)
 */
export declare const getAdminUpdateShareLinksUrl: () => string;
export declare const adminUpdateShareLinks: (shareLinksUpdate: ShareLinksUpdate, options?: RequestInit) => Promise<ShareLinksConfig>;
export declare const getAdminUpdateShareLinksMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateShareLinks>>, TError, {
        data: BodyType<ShareLinksUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminUpdateShareLinks>>, TError, {
    data: BodyType<ShareLinksUpdate>;
}, TContext>;
export type AdminUpdateShareLinksMutationResult = NonNullable<Awaited<ReturnType<typeof adminUpdateShareLinks>>>;
export type AdminUpdateShareLinksMutationBody = BodyType<ShareLinksUpdate>;
export type AdminUpdateShareLinksMutationError = ErrorType<unknown>;
/**
 * @summary Update the global share-link base URLs (admin only)
 */
export declare const useAdminUpdateShareLinks: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateShareLinks>>, TError, {
        data: BodyType<ShareLinksUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminUpdateShareLinks>>, TError, {
    data: BodyType<ShareLinksUpdate>;
}, TContext>;
/**
 * @summary Get global display toggles (hide volume / hide influencer status)
 */
export declare const getGetDisplayFlagsUrl: () => string;
export declare const getDisplayFlags: (options?: RequestInit) => Promise<DisplayFlags>;
export declare const getGetDisplayFlagsQueryKey: () => readonly ["/api/display-flags"];
export declare const getGetDisplayFlagsQueryOptions: <TData = Awaited<ReturnType<typeof getDisplayFlags>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDisplayFlags>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDisplayFlags>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDisplayFlagsQueryResult = NonNullable<Awaited<ReturnType<typeof getDisplayFlags>>>;
export type GetDisplayFlagsQueryError = ErrorType<unknown>;
/**
 * @summary Get global display toggles (hide volume / hide influencer status)
 */
export declare function useGetDisplayFlags<TData = Awaited<ReturnType<typeof getDisplayFlags>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDisplayFlags>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update global display toggles (admin only)
 */
export declare const getAdminUpdateDisplayFlagsUrl: () => string;
export declare const adminUpdateDisplayFlags: (displayFlagsUpdate: DisplayFlagsUpdate, options?: RequestInit) => Promise<DisplayFlags>;
export declare const getAdminUpdateDisplayFlagsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateDisplayFlags>>, TError, {
        data: BodyType<DisplayFlagsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminUpdateDisplayFlags>>, TError, {
    data: BodyType<DisplayFlagsUpdate>;
}, TContext>;
export type AdminUpdateDisplayFlagsMutationResult = NonNullable<Awaited<ReturnType<typeof adminUpdateDisplayFlags>>>;
export type AdminUpdateDisplayFlagsMutationBody = BodyType<DisplayFlagsUpdate>;
export type AdminUpdateDisplayFlagsMutationError = ErrorType<unknown>;
/**
 * @summary Update global display toggles (admin only)
 */
export declare const useAdminUpdateDisplayFlags: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateDisplayFlags>>, TError, {
        data: BodyType<DisplayFlagsUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminUpdateDisplayFlags>>, TError, {
    data: BodyType<DisplayFlagsUpdate>;
}, TContext>;
/**
 * @summary Get aggregated dashboard data for the authenticated user
 */
export declare const getGetDashboardUrl: () => string;
export declare const getDashboard: (options?: RequestInit) => Promise<Dashboard>;
export declare const getGetDashboardQueryKey: () => readonly ["/api/dashboard"];
export declare const getGetDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboard>>>;
export type GetDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Get aggregated dashboard data for the authenticated user
 */
export declare function useGetDashboard<TData = Awaited<ReturnType<typeof getDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get storefront stats for the authenticated user
 */
export declare const getGetStorefrontUrl: (params?: GetStorefrontParams) => string;
export declare const getStorefront: (params?: GetStorefrontParams, options?: RequestInit) => Promise<Storefront>;
export declare const getGetStorefrontQueryKey: (params?: GetStorefrontParams) => readonly ["/api/storefront", ...GetStorefrontParams[]];
export declare const getGetStorefrontQueryOptions: <TData = Awaited<ReturnType<typeof getStorefront>>, TError = ErrorType<unknown>>(params?: GetStorefrontParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStorefront>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStorefront>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStorefrontQueryResult = NonNullable<Awaited<ReturnType<typeof getStorefront>>>;
export type GetStorefrontQueryError = ErrorType<unknown>;
/**
 * @summary Get storefront stats for the authenticated user
 */
export declare function useGetStorefront<TData = Awaited<ReturnType<typeof getStorefront>>, TError = ErrorType<unknown>>(params?: GetStorefrontParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStorefront>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListOrdersUrl: () => string;
export declare const listOrders: (options?: RequestInit) => Promise<OrderItem[]>;
export declare const getListOrdersQueryKey: () => readonly ["/api/orders"];
export declare const getListOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listOrders>>>;
export type ListOrdersQueryError = ErrorType<unknown>;
export declare function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetOrderUrl: (id: number) => string;
export declare const getOrder: (id: number, options?: RequestInit) => Promise<OrderDetail>;
export declare const getGetOrderQueryKey: (id: number) => readonly [`/api/orders/${number}`];
export declare const getGetOrderQueryOptions: <TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOrderQueryResult = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
export type GetOrderQueryError = ErrorType<unknown>;
export declare function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Orders attributed to this user as the referrer (frontline)
 */
export declare const getListReferredOrdersUrl: () => string;
export declare const listReferredOrders: (options?: RequestInit) => Promise<ReferredOrderItem[]>;
export declare const getListReferredOrdersQueryKey: () => readonly ["/api/referred-orders"];
export declare const getListReferredOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listReferredOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReferredOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listReferredOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListReferredOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listReferredOrders>>>;
export type ListReferredOrdersQueryError = ErrorType<unknown>;
/**
 * @summary Orders attributed to this user as the referrer (frontline)
 */
export declare function useListReferredOrders<TData = Awaited<ReturnType<typeof listReferredOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReferredOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Search the authenticated user's downline to order/enroll on behalf of a customer
 */
export declare const getSearchDownlineUrl: (params?: SearchDownlineParams) => string;
export declare const searchDownline: (params?: SearchDownlineParams, options?: RequestInit) => Promise<DownlineMember[]>;
export declare const getSearchDownlineQueryKey: (params?: SearchDownlineParams) => readonly ["/api/downline/search", ...SearchDownlineParams[]];
export declare const getSearchDownlineQueryOptions: <TData = Awaited<ReturnType<typeof searchDownline>>, TError = ErrorType<unknown>>(params?: SearchDownlineParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchDownline>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof searchDownline>>, TError, TData> & {
    queryKey: QueryKey;
};
export type SearchDownlineQueryResult = NonNullable<Awaited<ReturnType<typeof searchDownline>>>;
export type SearchDownlineQueryError = ErrorType<unknown>;
/**
 * @summary Search the authenticated user's downline to order/enroll on behalf of a customer
 */
export declare function useSearchDownline<TData = Awaited<ReturnType<typeof searchDownline>>, TError = ErrorType<unknown>>(params?: SearchDownlineParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchDownline>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAddressesUrl: () => string;
export declare const listAddresses: (options?: RequestInit) => Promise<AddressItem[]>;
export declare const getListAddressesQueryKey: () => readonly ["/api/addresses"];
export declare const getListAddressesQueryOptions: <TData = Awaited<ReturnType<typeof listAddresses>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAddresses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAddresses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAddressesQueryResult = NonNullable<Awaited<ReturnType<typeof listAddresses>>>;
export type ListAddressesQueryError = ErrorType<unknown>;
export declare function useListAddresses<TData = Awaited<ReturnType<typeof listAddresses>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAddresses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateAddressUrl: () => string;
export declare const createAddress: (addressInput: AddressInput, options?: RequestInit) => Promise<AddressItem>;
export declare const getCreateAddressMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAddress>>, TError, {
        data: BodyType<AddressInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAddress>>, TError, {
    data: BodyType<AddressInput>;
}, TContext>;
export type CreateAddressMutationResult = NonNullable<Awaited<ReturnType<typeof createAddress>>>;
export type CreateAddressMutationBody = BodyType<AddressInput>;
export type CreateAddressMutationError = ErrorType<unknown>;
export declare const useCreateAddress: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAddress>>, TError, {
        data: BodyType<AddressInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAddress>>, TError, {
    data: BodyType<AddressInput>;
}, TContext>;
export declare const getUpdateAddressUrl: (id: number) => string;
export declare const updateAddress: (id: number, addressInput: AddressInput, options?: RequestInit) => Promise<AddressItem>;
export declare const getUpdateAddressMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAddress>>, TError, {
        id: number;
        data: BodyType<AddressInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAddress>>, TError, {
    id: number;
    data: BodyType<AddressInput>;
}, TContext>;
export type UpdateAddressMutationResult = NonNullable<Awaited<ReturnType<typeof updateAddress>>>;
export type UpdateAddressMutationBody = BodyType<AddressInput>;
export type UpdateAddressMutationError = ErrorType<unknown>;
export declare const useUpdateAddress: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAddress>>, TError, {
        id: number;
        data: BodyType<AddressInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAddress>>, TError, {
    id: number;
    data: BodyType<AddressInput>;
}, TContext>;
export declare const getDeleteAddressUrl: (id: number) => string;
export declare const deleteAddress: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteAddressMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAddress>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAddress>>, TError, {
    id: number;
}, TContext>;
export type DeleteAddressMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAddress>>>;
export type DeleteAddressMutationError = ErrorType<unknown>;
export declare const useDeleteAddress: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAddress>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAddress>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary MLM placement info (sponsor, influencer id, joined date)
 */
export declare const getGetPlacementUrl: () => string;
export declare const getPlacement: (options?: RequestInit) => Promise<Placement>;
export declare const getGetPlacementQueryKey: () => readonly ["/api/placement"];
export declare const getGetPlacementQueryOptions: <TData = Awaited<ReturnType<typeof getPlacement>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlacement>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPlacement>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPlacementQueryResult = NonNullable<Awaited<ReturnType<typeof getPlacement>>>;
export type GetPlacementQueryError = ErrorType<unknown>;
/**
 * @summary MLM placement info (sponsor, influencer id, joined date)
 */
export declare function useGetPlacement<TData = Awaited<ReturnType<typeof getPlacement>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPlacement>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminListUsersUrl: () => string;
export declare const adminListUsers: (options?: RequestInit) => Promise<AdminUser[]>;
export declare const getAdminListUsersQueryKey: () => readonly ["/api/admin/users"];
export declare const getAdminListUsersQueryOptions: <TData = Awaited<ReturnType<typeof adminListUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof adminListUsers>>>;
export type AdminListUsersQueryError = ErrorType<unknown>;
export declare function useAdminListUsers<TData = Awaited<ReturnType<typeof adminListUsers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminCreateUserUrl: () => string;
export declare const adminCreateUser: (adminCreateUserRequest: AdminCreateUserRequest, options?: RequestInit) => Promise<AdminUser>;
export declare const getAdminCreateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateUser>>, TError, {
        data: BodyType<AdminCreateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminCreateUser>>, TError, {
    data: BodyType<AdminCreateUserRequest>;
}, TContext>;
export type AdminCreateUserMutationResult = NonNullable<Awaited<ReturnType<typeof adminCreateUser>>>;
export type AdminCreateUserMutationBody = BodyType<AdminCreateUserRequest>;
export type AdminCreateUserMutationError = ErrorType<unknown>;
export declare const useAdminCreateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminCreateUser>>, TError, {
        data: BodyType<AdminCreateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminCreateUser>>, TError, {
    data: BodyType<AdminCreateUserRequest>;
}, TContext>;
export declare const getAdminUpdateUserUrl: (clerkUserId: string) => string;
export declare const adminUpdateUser: (clerkUserId: string, adminUserUpdate: AdminUserUpdate, options?: RequestInit) => Promise<Profile>;
export declare const getAdminUpdateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateUser>>, TError, {
        clerkUserId: string;
        data: BodyType<AdminUserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminUpdateUser>>, TError, {
    clerkUserId: string;
    data: BodyType<AdminUserUpdate>;
}, TContext>;
export type AdminUpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof adminUpdateUser>>>;
export type AdminUpdateUserMutationBody = BodyType<AdminUserUpdate>;
export type AdminUpdateUserMutationError = ErrorType<unknown>;
export declare const useAdminUpdateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminUpdateUser>>, TError, {
        clerkUserId: string;
        data: BodyType<AdminUserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminUpdateUser>>, TError, {
    clerkUserId: string;
    data: BodyType<AdminUserUpdate>;
}, TContext>;
export declare const getAdminSetPasswordUrl: (clerkUserId: string) => string;
export declare const adminSetPassword: (clerkUserId: string, adminSetPasswordRequest: AdminSetPasswordRequest, options?: RequestInit) => Promise<AdminOkResponse>;
export declare const getAdminSetPasswordMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminSetPassword>>, TError, {
        clerkUserId: string;
        data: BodyType<AdminSetPasswordRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminSetPassword>>, TError, {
    clerkUserId: string;
    data: BodyType<AdminSetPasswordRequest>;
}, TContext>;
export type AdminSetPasswordMutationResult = NonNullable<Awaited<ReturnType<typeof adminSetPassword>>>;
export type AdminSetPasswordMutationBody = BodyType<AdminSetPasswordRequest>;
export type AdminSetPasswordMutationError = ErrorType<unknown>;
export declare const useAdminSetPassword: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminSetPassword>>, TError, {
        clerkUserId: string;
        data: BodyType<AdminSetPasswordRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminSetPassword>>, TError, {
    clerkUserId: string;
    data: BodyType<AdminSetPasswordRequest>;
}, TContext>;
export declare const getAdminChangeEmailUrl: (clerkUserId: string) => string;
export declare const adminChangeEmail: (clerkUserId: string, adminChangeEmailRequest: AdminChangeEmailRequest, options?: RequestInit) => Promise<AdminOkResponse>;
export declare const getAdminChangeEmailMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminChangeEmail>>, TError, {
        clerkUserId: string;
        data: BodyType<AdminChangeEmailRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminChangeEmail>>, TError, {
    clerkUserId: string;
    data: BodyType<AdminChangeEmailRequest>;
}, TContext>;
export type AdminChangeEmailMutationResult = NonNullable<Awaited<ReturnType<typeof adminChangeEmail>>>;
export type AdminChangeEmailMutationBody = BodyType<AdminChangeEmailRequest>;
export type AdminChangeEmailMutationError = ErrorType<unknown>;
export declare const useAdminChangeEmail: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminChangeEmail>>, TError, {
        clerkUserId: string;
        data: BodyType<AdminChangeEmailRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminChangeEmail>>, TError, {
    clerkUserId: string;
    data: BodyType<AdminChangeEmailRequest>;
}, TContext>;
export declare const getAdminTransferAccountUrl: () => string;
export declare const adminTransferAccount: (adminTransferAccountRequest: AdminTransferAccountRequest, options?: RequestInit) => Promise<AdminTransferAccountResult>;
export declare const getAdminTransferAccountMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminTransferAccount>>, TError, {
        data: BodyType<AdminTransferAccountRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminTransferAccount>>, TError, {
    data: BodyType<AdminTransferAccountRequest>;
}, TContext>;
export type AdminTransferAccountMutationResult = NonNullable<Awaited<ReturnType<typeof adminTransferAccount>>>;
export type AdminTransferAccountMutationBody = BodyType<AdminTransferAccountRequest>;
export type AdminTransferAccountMutationError = ErrorType<unknown>;
export declare const useAdminTransferAccount: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminTransferAccount>>, TError, {
        data: BodyType<AdminTransferAccountRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminTransferAccount>>, TError, {
    data: BodyType<AdminTransferAccountRequest>;
}, TContext>;
export declare const getAdminListOrdersUrl: () => string;
export declare const adminListOrders: (options?: RequestInit) => Promise<AdminOrderItem[]>;
export declare const getAdminListOrdersQueryKey: () => readonly ["/api/admin/orders"];
export declare const getAdminListOrdersQueryOptions: <TData = Awaited<ReturnType<typeof adminListOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminListOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminListOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof adminListOrders>>>;
export type AdminListOrdersQueryError = ErrorType<unknown>;
export declare function useAdminListOrders<TData = Awaited<ReturnType<typeof adminListOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminListOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminGetOrderUrl: (id: number) => string;
export declare const adminGetOrder: (id: number, options?: RequestInit) => Promise<AdminOrderDetail>;
export declare const getAdminGetOrderQueryKey: (id: number) => readonly [`/api/admin/orders/${number}`];
export declare const getAdminGetOrderQueryOptions: <TData = Awaited<ReturnType<typeof adminGetOrder>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminGetOrder>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminGetOrderQueryResult = NonNullable<Awaited<ReturnType<typeof adminGetOrder>>>;
export type AdminGetOrderQueryError = ErrorType<void>;
export declare function useAdminGetOrder<TData = Awaited<ReturnType<typeof adminGetOrder>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminGetUserDetailUrl: (clerkUserId: string) => string;
export declare const adminGetUserDetail: (clerkUserId: string, options?: RequestInit) => Promise<AdminUserDetail>;
export declare const getAdminGetUserDetailQueryKey: (clerkUserId: string) => readonly [`/api/admin/users/${string}/detail`];
export declare const getAdminGetUserDetailQueryOptions: <TData = Awaited<ReturnType<typeof adminGetUserDetail>>, TError = ErrorType<void>>(clerkUserId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetUserDetail>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminGetUserDetail>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminGetUserDetailQueryResult = NonNullable<Awaited<ReturnType<typeof adminGetUserDetail>>>;
export type AdminGetUserDetailQueryError = ErrorType<void>;
export declare function useAdminGetUserDetail<TData = Awaited<ReturnType<typeof adminGetUserDetail>>, TError = ErrorType<void>>(clerkUserId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetUserDetail>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminGetIntegrationsUrl: () => string;
export declare const adminGetIntegrations: (options?: RequestInit) => Promise<IntegrationsStatus>;
export declare const getAdminGetIntegrationsQueryKey: () => readonly ["/api/admin/integrations"];
export declare const getAdminGetIntegrationsQueryOptions: <TData = Awaited<ReturnType<typeof adminGetIntegrations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetIntegrations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminGetIntegrations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminGetIntegrationsQueryResult = NonNullable<Awaited<ReturnType<typeof adminGetIntegrations>>>;
export type AdminGetIntegrationsQueryError = ErrorType<unknown>;
export declare function useAdminGetIntegrations<TData = Awaited<ReturnType<typeof adminGetIntegrations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetIntegrations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Returns all translation overrides (both published and draft) keyed by English text.
 */
export declare const getAdminGetTranslationsUrl: () => string;
export declare const adminGetTranslations: (options?: RequestInit) => Promise<AdminTranslationsState>;
export declare const getAdminGetTranslationsQueryKey: () => readonly ["/api/admin/translations"];
export declare const getAdminGetTranslationsQueryOptions: <TData = Awaited<ReturnType<typeof adminGetTranslations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetTranslations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof adminGetTranslations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type AdminGetTranslationsQueryResult = NonNullable<Awaited<ReturnType<typeof adminGetTranslations>>>;
export type AdminGetTranslationsQueryError = ErrorType<unknown>;
/**
 * @summary Returns all translation overrides (both published and draft) keyed by English text.
 */
export declare function useAdminGetTranslations<TData = Awaited<ReturnType<typeof adminGetTranslations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof adminGetTranslations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Replace the draft set wholesale with the provided map. Empty/missing keys clear their draft.
 */
export declare const getAdminPutTranslationDraftsUrl: () => string;
export declare const adminPutTranslationDrafts: (adminPutTranslationDraftsRequest: AdminPutTranslationDraftsRequest, options?: RequestInit) => Promise<AdminTranslationsState>;
export declare const getAdminPutTranslationDraftsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminPutTranslationDrafts>>, TError, {
        data: BodyType<AdminPutTranslationDraftsRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminPutTranslationDrafts>>, TError, {
    data: BodyType<AdminPutTranslationDraftsRequest>;
}, TContext>;
export type AdminPutTranslationDraftsMutationResult = NonNullable<Awaited<ReturnType<typeof adminPutTranslationDrafts>>>;
export type AdminPutTranslationDraftsMutationBody = BodyType<AdminPutTranslationDraftsRequest>;
export type AdminPutTranslationDraftsMutationError = ErrorType<unknown>;
/**
 * @summary Replace the draft set wholesale with the provided map. Empty/missing keys clear their draft.
 */
export declare const useAdminPutTranslationDrafts: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminPutTranslationDrafts>>, TError, {
        data: BodyType<AdminPutTranslationDraftsRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminPutTranslationDrafts>>, TError, {
    data: BodyType<AdminPutTranslationDraftsRequest>;
}, TContext>;
/**
 * @summary Promote all drafts to published. Drafts are then cleared.
 */
export declare const getAdminPublishTranslationsUrl: () => string;
export declare const adminPublishTranslations: (options?: RequestInit) => Promise<AdminTranslationsState>;
export declare const getAdminPublishTranslationsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminPublishTranslations>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminPublishTranslations>>, TError, void, TContext>;
export type AdminPublishTranslationsMutationResult = NonNullable<Awaited<ReturnType<typeof adminPublishTranslations>>>;
export type AdminPublishTranslationsMutationError = ErrorType<unknown>;
/**
 * @summary Promote all drafts to published. Drafts are then cleared.
 */
export declare const useAdminPublishTranslations: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminPublishTranslations>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminPublishTranslations>>, TError, void, TContext>;
/**
 * @summary Clear all draft overrides.
 */
export declare const getAdminDiscardTranslationDraftsUrl: () => string;
export declare const adminDiscardTranslationDrafts: (options?: RequestInit) => Promise<AdminTranslationsState>;
export declare const getAdminDiscardTranslationDraftsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDiscardTranslationDrafts>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminDiscardTranslationDrafts>>, TError, void, TContext>;
export type AdminDiscardTranslationDraftsMutationResult = NonNullable<Awaited<ReturnType<typeof adminDiscardTranslationDrafts>>>;
export type AdminDiscardTranslationDraftsMutationError = ErrorType<unknown>;
/**
 * @summary Clear all draft overrides.
 */
export declare const useAdminDiscardTranslationDrafts: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminDiscardTranslationDrafts>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminDiscardTranslationDrafts>>, TError, void, TContext>;
/**
 * @summary Public map of published Chinese translation overrides. Read by every client on load.
 */
export declare const getGetPublishedTranslationsUrl: () => string;
export declare const getPublishedTranslations: (options?: RequestInit) => Promise<PublishedTranslations>;
export declare const getGetPublishedTranslationsQueryKey: () => readonly ["/api/translations"];
export declare const getGetPublishedTranslationsQueryOptions: <TData = Awaited<ReturnType<typeof getPublishedTranslations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublishedTranslations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPublishedTranslations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPublishedTranslationsQueryResult = NonNullable<Awaited<ReturnType<typeof getPublishedTranslations>>>;
export type GetPublishedTranslationsQueryError = ErrorType<unknown>;
/**
 * @summary Public map of published Chinese translation overrides. Read by every client on load.
 */
export declare function useGetPublishedTranslations<TData = Awaited<ReturnType<typeof getPublishedTranslations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublishedTranslations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Send an SMS verification code (MVP — dev mode returns code in response)
 */
export declare const getSmsSendCodeUrl: () => string;
export declare const smsSendCode: (smsSendCodeRequest: SmsSendCodeRequest, options?: RequestInit) => Promise<SmsSendCodeResult>;
export declare const getSmsSendCodeMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof smsSendCode>>, TError, {
        data: BodyType<SmsSendCodeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof smsSendCode>>, TError, {
    data: BodyType<SmsSendCodeRequest>;
}, TContext>;
export type SmsSendCodeMutationResult = NonNullable<Awaited<ReturnType<typeof smsSendCode>>>;
export type SmsSendCodeMutationBody = BodyType<SmsSendCodeRequest>;
export type SmsSendCodeMutationError = ErrorType<void>;
/**
 * @summary Send an SMS verification code (MVP — dev mode returns code in response)
 */
export declare const useSmsSendCode: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof smsSendCode>>, TError, {
        data: BodyType<SmsSendCodeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof smsSendCode>>, TError, {
    data: BodyType<SmsSendCodeRequest>;
}, TContext>;
/**
 * @summary Verify the SMS code sent to the user's phone
 */
export declare const getSmsVerifyCodeUrl: () => string;
export declare const smsVerifyCode: (smsVerifyCodeRequest: SmsVerifyCodeRequest, options?: RequestInit) => Promise<SmsVerifyCodeResult>;
export declare const getSmsVerifyCodeMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof smsVerifyCode>>, TError, {
        data: BodyType<SmsVerifyCodeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof smsVerifyCode>>, TError, {
    data: BodyType<SmsVerifyCodeRequest>;
}, TContext>;
export type SmsVerifyCodeMutationResult = NonNullable<Awaited<ReturnType<typeof smsVerifyCode>>>;
export type SmsVerifyCodeMutationBody = BodyType<SmsVerifyCodeRequest>;
export type SmsVerifyCodeMutationError = ErrorType<void>;
/**
 * @summary Verify the SMS code sent to the user's phone
 */
export declare const useSmsVerifyCode: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof smsVerifyCode>>, TError, {
        data: BodyType<SmsVerifyCodeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof smsVerifyCode>>, TError, {
    data: BodyType<SmsVerifyCodeRequest>;
}, TContext>;
/**
 * @summary Look up a Shopify order to prefill the signup form
 */
export declare const getLookupOrderForSignupUrl: () => string;
export declare const lookupOrderForSignup: (orderLookupRequest: OrderLookupRequest, options?: RequestInit) => Promise<OrderLookupResult>;
export declare const getLookupOrderForSignupMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof lookupOrderForSignup>>, TError, {
        data: BodyType<OrderLookupRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof lookupOrderForSignup>>, TError, {
    data: BodyType<OrderLookupRequest>;
}, TContext>;
export type LookupOrderForSignupMutationResult = NonNullable<Awaited<ReturnType<typeof lookupOrderForSignup>>>;
export type LookupOrderForSignupMutationBody = BodyType<OrderLookupRequest>;
export type LookupOrderForSignupMutationError = ErrorType<void>;
/**
 * @summary Look up a Shopify order to prefill the signup form
 */
export declare const useLookupOrderForSignup: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof lookupOrderForSignup>>, TError, {
        data: BodyType<OrderLookupRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof lookupOrderForSignup>>, TError, {
    data: BodyType<OrderLookupRequest>;
}, TContext>;
/**
 * @summary Check whether an email address already has an account
 */
export declare const getCheckSignupEmailUrl: () => string;
export declare const checkSignupEmail: (checkSignupEmailRequest: CheckSignupEmailRequest, options?: RequestInit) => Promise<CheckSignupEmailResult>;
export declare const getCheckSignupEmailMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkSignupEmail>>, TError, {
        data: BodyType<CheckSignupEmailRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof checkSignupEmail>>, TError, {
    data: BodyType<CheckSignupEmailRequest>;
}, TContext>;
export type CheckSignupEmailMutationResult = NonNullable<Awaited<ReturnType<typeof checkSignupEmail>>>;
export type CheckSignupEmailMutationBody = BodyType<CheckSignupEmailRequest>;
export type CheckSignupEmailMutationError = ErrorType<void>;
/**
 * @summary Check whether an email address already has an account
 */
export declare const useCheckSignupEmail: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkSignupEmail>>, TError, {
        data: BodyType<CheckSignupEmailRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof checkSignupEmail>>, TError, {
    data: BodyType<CheckSignupEmailRequest>;
}, TContext>;
/**
 * @summary Create the customer/affiliate record in the Kwik MLM backend during /activate signup
 */
export declare const getCreateAffiliateUrl: () => string;
export declare const createAffiliate: (affiliateInput: AffiliateInput, options?: RequestInit) => Promise<AffiliateCreateResult>;
export declare const getCreateAffiliateMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAffiliate>>, TError, {
        data: BodyType<AffiliateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAffiliate>>, TError, {
    data: BodyType<AffiliateInput>;
}, TContext>;
export type CreateAffiliateMutationResult = NonNullable<Awaited<ReturnType<typeof createAffiliate>>>;
export type CreateAffiliateMutationBody = BodyType<AffiliateInput>;
export type CreateAffiliateMutationError = ErrorType<void>;
/**
 * @summary Create the customer/affiliate record in the Kwik MLM backend during /activate signup
 */
export declare const useCreateAffiliate: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAffiliate>>, TError, {
        data: BodyType<AffiliateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAffiliate>>, TError, {
    data: BodyType<AffiliateInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map