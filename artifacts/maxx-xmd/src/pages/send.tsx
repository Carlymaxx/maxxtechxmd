import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSendMessage } from "@workspace/api-client-react";
import { CyberCard } from "@/components/ui/cyber-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Send as SendIcon, Terminal } from "lucide-react";

const formSchema = z.object({
  number: z.string().min(10, "Target number required").regex(/^\d+$/, "Numbers only"),
  message: z.string().min(1, "Message payload cannot be empty"),
});

export default function Send() {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { number: "", message: "" },
  });

  const sendMut = useSendMessage({
    mutation: {
      onSuccess: () => {
        toast({ title: "Payload Transmitted", description: "Message dispatched to network." });
        form.reset({ ...form.getValues(), message: "" }); // keep number, clear msg
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Transmission Failed", description: err.error?.error || "Unknown error" });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    sendMut.mutate({ data: values });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl text-primary font-mono glow-text">TRANSMIT_PAYLOAD</h1>
        <p className="text-muted-foreground font-mono mt-1">Direct message injection via main node</p>
      </div>

      <CyberCard title={<><Terminal className="inline w-4 h-4 mr-2" />Message Console</>} delay={0.1}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-primary">TARGET_VECTOR (Phone Number)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="2348000000000" 
                      {...field} 
                      className="font-mono bg-black/50 border-primary/30"
                    />
                  </FormControl>
                  <FormMessage className="font-mono" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-primary">DATA_PAYLOAD</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter message text here..." 
                      className="min-h-[150px] font-mono bg-black/50 border-primary/30 resize-y"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="font-mono" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={sendMut.isPending}
              className="w-full cyber-button h-12 font-mono text-lg bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,200,255,0.3)] hover:shadow-[0_0_25px_rgba(0,200,255,0.6)]"
            >
              <SendIcon className="w-5 h-5 mr-2" />
              {sendMut.isPending ? 'TRANSMITTING...' : 'EXECUTE_SEND'}
            </Button>
          </form>
        </Form>
      </CyberCard>
    </div>
  );
}
