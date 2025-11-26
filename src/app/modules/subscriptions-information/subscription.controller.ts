import e, {  Request, Response } from "express";
import { SubscriptionDetailModel, subscriptionplanModel } from "./subscriptions.model";
import { createCustomer, monthly_trial_subscription_start, saveCardDetailes } from "../../../helpers/Subscription";




declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string };
    }
  }
}

















export  const creatsubscriptionplan = async (req:Request,res:Response) => {
  try {
    const {name,stripe_price_id,trial_days,have_trial,amount,type}=req.body;

    const subscriptionplan = new subscriptionplanModel({  
      name,
      stripe_price_id,
      trial_days,
      have_trial,
      amount,
      type
    });
    await subscriptionplan.save();
    res.status(200).json({ success: true, message: "Subscription plan created successfully", data: subscriptionplan});
  } catch (error) {
    res.status(400).json({success:false, message: "Internal server error", error });
  }
}










export const getsubscriptionplan = async (req:Request,res:Response) => {
  try {
    const subscriptionplan = await subscriptionplanModel.find();
    res.status(200).json({ success: true, message: "Subscription plan fetched successfully", data: subscriptionplan});
  } catch (error) {
    res.status(400).json({success:false, message: "Internal server error", error });
  }
}





export const addpalndatails = async (req:Request,res:Response) => {
  try {
    const {plan_id}=req.body;

    const plan = await subscriptionplanModel.findOne({_id:plan_id});
    if(!plan){
      return res.status(404).json({success:false, message: "Plan not found"});
    }

      const user_id = req.user?.id;
  

   const haveBuyedAnyPlan=await  SubscriptionDetailModel.countDocuments({user_id})

       var subs_msg='';
    if(haveBuyedAnyPlan == 0 && plan.have_trial === true){
    subs_msg=`you have availed a trial period of ${plan.trial_days} days. After the trial period, you will be charged $${plan.amount} for the ${plan.name} plan.`;
    }
    else{
      subs_msg=`we will charge you $${plan.amount} for the ${plan.name} plan.`;
    }
   
    res.status(200).json({ success: true, message: subs_msg, data: plan});
  } catch (error) {
    res.status(400).json({success:false, message: "Internal server error", error });
  }
}






export const createsubscription = async (req:Request,res:Response) => {
  try {
     
 const userrData = req.user;
    const {plan_id,card_id}=req.body;
   

   const subscriptionplan = await subscriptionplanModel.findOne({_id:plan_id});
    if(!subscriptionplan){
      return res.status(404).json({success:false, message: "Plan not found"});
    }







   if(!userrData){
      return res.status(401).json({success:false, message: "User not authenticated"});
   }



   // create customer
   const customer = await createCustomer(userrData.name,userrData.email,card_id.id);

   if(!customer.success){
      return res.status(400).json({success:false, message: customer.error});
    }
     

    const Customer=customer.data as any;
    const customer_id = Customer.id as string;



    // save card detailes
    const cardDetails=await saveCardDetailes(plan_id.card,userrData.id,customer_id);

   if(!cardDetails.success){
      return res.status(400).json({success:false, message: cardDetails.error});
    }
     
   const cardData=cardDetails.data as any;



//  subscription wurking start
const user_id = userrData.id;

var subscriptiondata=null;

if(subscriptionplan.type == 0){
      // monthly subscription with trial                     subscriptionplan
     await monthly_trial_subscription_start(customer_id, user_id, subscriptionplan._id.toString());
}
else if(subscriptionplan.type == 1){
      // monthly subscription without trial
}
else if(subscriptionplan.type == 2){
      // yearly subscription with trial
}











   return res.status(200).json({success:true, message: "subscription created successfully",data:subscriptiondata });

    } catch (error) {
      console.log(error);
      return res.status(500).json({success:false, message: "Internal server error"});
    }
  }