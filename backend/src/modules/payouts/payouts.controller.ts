import type { Request, RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler";
import { sendSuccess } from "../../common/http";
import {
    assertValidRequest,
    getValidatedBody,
    getValidatedParams,
    getValidatedQuery,
} from "../../common/validation";
import {
    createHostPayout,
    CreateHostPayoutInput,
    createPayoutAccount,
    CreatePayoutAccountInput,
    deletePayoutAccount,
    getAdminHostPayouts,
    AdminPayoutListQuery,
    getHostPayoutAccounts,
    getHostPayouts,
    MarkPayoutPaidInput,
    markHostPayoutPaid,
    PayoutListQuery,
    updatePayoutAccount,
    UpdatePayoutAccountInput,
} from "./payouts.service";

const auditContextFromRequest = (req: Request) => ({
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null,
});

export const listPayoutAccounts: RequestHandler = asyncHandler(async (req, res) => {
    const result = await getHostPayoutAccounts(req.user!);

    return sendSuccess(res, {
        data: result,
    });
});

export const createNewPayoutAccount: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const payload = getValidatedBody<CreatePayoutAccountInput>(req);
    const result = await createPayoutAccount(req.user!, payload);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Payout account created",
        data: result,
    });
});

export const updateExistingPayoutAccount: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const params = getValidatedParams<{ payoutAccountId: number }>(req);
    const payload = getValidatedBody<UpdatePayoutAccountInput>(req);
    const result = await updatePayoutAccount(req.user!, params.payoutAccountId, payload);

    return sendSuccess(res, {
        message: "Payout account updated",
        data: result,
    });
});

export const deleteExistingPayoutAccount: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const params = getValidatedParams<{ payoutAccountId: number }>(req);
    await deletePayoutAccount(req.user!, params.payoutAccountId);

    return sendSuccess(res, {
        message: "Payout account deleted",
    });
});

export const listHostPayouts: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const queryParams = getValidatedQuery<PayoutListQuery>(req);
    const result = await getHostPayouts(req.user!, queryParams);

    return sendSuccess(res, {
        data: result,
    });
});

export const listAdminHostPayouts: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const queryParams = getValidatedQuery<AdminPayoutListQuery>(req);
    const result = await getAdminHostPayouts(req.user!, queryParams);

    return sendSuccess(res, {
        data: result,
    });
});

export const createAdminHostPayout: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const payload = getValidatedBody<CreateHostPayoutInput>(req);
    const result = await createHostPayout(req.user!, payload, auditContextFromRequest(req));

    return sendSuccess(res, {
        statusCode: 201,
        message: "Payout created",
        data: result,
    });
});

export const markAdminHostPayoutPaid: RequestHandler = asyncHandler(async (req, res) => {
    assertValidRequest(req);

    const params = getValidatedParams<{ payoutId: number }>(req);
    const payload = getValidatedBody<MarkPayoutPaidInput>(req);
    const result = await markHostPayoutPaid(params.payoutId, req.user!, payload, auditContextFromRequest(req));

    return sendSuccess(res, {
        message: "Payout marked as paid",
        data: result,
    });
});
