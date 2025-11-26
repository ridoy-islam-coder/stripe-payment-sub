import Stripe from "stripe";
import { cardDetailModel, subscriptionplanModel } from "../app/modules/subscriptions-information/subscriptions.model";
import { config } from "../app/config";
import { SubscriptionDetailModel } from './../app/modules/subscriptions-information/subscriptions.model';


const stripe = new Stripe(config.stripe_secret_key as string, );


export interface Isubscription {
  name: string
  email: string
  token_id: string
 
}




export const createCustomer = async ( name: string,email: string,token_id: string) => {


  try {
    const customer = await stripe.customers.create({
      name,
      email,
      source: token_id,
    });

    return { success: true, data: customer };

  } catch (err) {
   return {success: false, error: err};
  }
};






export const saveCardDetailes = async (data: any, user_id: string, customer_id: string) => {
 

  try {
  

    const card = new cardDetailModel({
        user_id: user_id,
        customer_id: customer_id,
        card_id: data.id ,
        name: data.name ? data.name : '',
        card_no: data.card ,
        brend: data.brand ,
        month: data.month ,
        year: data.exp_year ,
    });

    const savedCard = await card.save();

    return { success: true, data: savedCard };

  } catch (err) {
   return {success: false, error: err};
  }
};













const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).toString().padStart(2, '0');
  const day = String(date.getDate()).toString().padStart(2, '0');
  const hours = String(date.getHours()).toString().padStart(2, '0');
  const minutes = String(date.getMinutes()).toString().padStart(2, '0');
  const seconds = String(date.getSeconds()).toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
 
}

export const monthly_trial_subscription_start = async ( user_id: string, customer_id: string, subscriptionPlan: any ) => {


  try {
  

var subscriptiondata=null;
const currentDate=new Date()
const futureDate = new Date(currentDate);
const trialDays = subscriptionPlan.trial_days ?? 0;
futureDate.setDate(currentDate.getDate() + subscriptionPlan.trial_days);
futureDate.setHours(23, 59, 59, 999);
const current_period_start=formatDate(currentDate);
const trial_days=formatDate(futureDate);





const SubscriptionDetailModelData={
  user_id: user_id,
  stripe_Subscription_id: null,  
  stripe_Subscription_schedule_id: "",
  stripe_customer_id: customer_id,
  subscription_plan_price_id: subscriptionPlan._id,
  plan_amount: subscriptionPlan.price,
  plan_amount_currency: "usd",
  plan_interval: "month",
  plan_interval_count: 1,
  plan_period_start: current_period_start,
  plan_period_end: trial_days,
  trial_end: trial_days,
  status: "active",
  cancel: false,
  created: current_period_start,
  canceled_at: null
 
};

const subscriptionDoc = new SubscriptionDetailModel(SubscriptionDetailModelData);

subscriptiondata = await subscriptionDoc.save();

return subscriptiondata;

  
  } catch (err) {
console.log(err);

   return null;
  }
};

