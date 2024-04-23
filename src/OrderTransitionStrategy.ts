
export interface OrderTransitionStrategy
{
    doTransition(): Promise<boolean>;
}