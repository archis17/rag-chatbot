
import { ChatBedrockConverse } from "@langchain/aws";

async function main() {
    console.log("Checking environment variables...");
    const region = "us-east-1";
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const model = "amazon.titan-text-express-v1";

    if (!region || !accessKeyId || !secretAccessKey) {
        console.error("Missing AWS credentials in environment.");
        console.log("AWS_REGION:", region);
        console.log("AWS_ACCESS_KEY_ID:", accessKeyId ? "Set" : "Missing");
        console.log("AWS_SECRET_ACCESS_KEY:", secretAccessKey ? "Set" : "Missing");
        process.exit(1);
    }

    console.log(`Initializing ChatBedrockConverse with model: ${model} in region ${region}`);

    try {
        const llm = new ChatBedrockConverse({
            model,
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            temperature: 0,
        });

        console.log("Sending test invocation...");
        const response = await llm.invoke("Hello, are you online? Respond with 'Yes, I am Bedrock'.");
        console.log("Response received:");
        console.log(response.content);
        console.log("Verification successful!");
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

main();
