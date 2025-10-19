// src/kafka/producer.js
import dotenv from "dotenv";
dotenv.config();

export async function sendAnalyticsEvent(event) {
  if (process.env.ENABLE_KAFKA !== "true") {
    // for now just log
    console.log("[ANALYTICS STUB]", event.type, event);
    return;
  }
  // TODO: implement Kafka producer send here (kafka-node or kafkajs)
  // Example: produce event to topic 'game-analytics'
}
