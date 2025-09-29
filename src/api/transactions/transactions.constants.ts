export enum TRANSACTION_TYPE {
    DEPOSIT = 0,
    WITHDRAW = 1
}

export enum TRANSACTION_STATUS {
    PENDING = 0,
    SUCCESS = 1,
    FAILED = 2
}

export const transactionTypes = {
    [TRANSACTION_TYPE.DEPOSIT]: 'Deposit',
    [TRANSACTION_TYPE.WITHDRAW]: 'Withdraw'
}

export const transactionStatuses = {
    [TRANSACTION_STATUS.PENDING]: 'Pending',
    [TRANSACTION_STATUS.SUCCESS]: 'Success',
    [TRANSACTION_STATUS.FAILED]: 'Failed'
}
