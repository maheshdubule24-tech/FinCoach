import React from "react";

export default function RazorPayButton({ amount }) {
  const openRazorpay = async () => {
    const res = await fetch("/api/payment/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const order = await res.json();

    const options = {
      key: "YOUR_RAZORPAY_KEY",
      amount: order.amount,
      currency: "INR",
      order_id: order.id,
      handler: async function (response) {
        alert("Payment Successful!");
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button
      onClick={openRazorpay}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Pay ₹{amount}
    </button>
  );
}