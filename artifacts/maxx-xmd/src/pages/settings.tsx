import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { CyberCard } from "@/components/ui/cyber-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings2, Shield, MessageSquare, Heart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useGetSettings();
  
  const form = useForm({
    defaultValues: {
      prefix: ".",
      botName: "",
      ownerName: "",
      ownerNumber: "",
      mode: "public",
      welcomeMessage: false,
      goodbyeMessage: false,
      anticall: false,
      chatbot: false,
      autoread: false,
      autoviewstatus: false,
      autolikestatus: false,
      autolikestatus_emoji: "💚",
      antilink: false,
      alwaysonline: false,
      autotyping: false,
      autobio: false,
      autoreaction: false,
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const updateMut = useUpdateSettings({
    mutation: {
      onSuccess: () => toast({ title: "Configuration Updated", description: "System parameters saved successfully." }),
      onError: () => toast({ variant: "destructive", title: "Update Failed", description: "Could not save parameters." })
    }
  });

  if (isLoading) return <div className="text-primary font-mono animate-pulse">LOADING_CONFIG...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl text-primary font-mono glow-text">CORE_SETTINGS</h1>
        <p className="text-muted-foreground font-mono mt-1">Adjust system parameters and behaviors</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => updateMut.mutate({ data }))} className="space-y-8">
          
          {/* Identity Config */}
          <CyberCard title="Identity Matrix" delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="botName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-primary">BOT_NAME</FormLabel>
                  <FormControl><Input {...field} className="font-mono bg-black/50" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="prefix" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-primary">CMD_PREFIX</FormLabel>
                  <FormControl><Input {...field} className="font-mono bg-black/50" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="ownerName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-primary">OWNER_NAME</FormLabel>
                  <FormControl><Input {...field} className="font-mono bg-black/50" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="ownerNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-primary">OWNER_NUMBER</FormLabel>
                  <FormControl><Input {...field} className="font-mono bg-black/50" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="mode" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-primary">OPERATING_MODE</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono bg-black/50">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-primary/30">
                      <SelectItem value="public" className="font-mono text-primary">PUBLIC</SelectItem>
                      <SelectItem value="private" className="font-mono text-primary">PRIVATE</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
          </CyberCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Security & Moderation */}
            <CyberCard title={<><Shield className="inline w-4 h-4 mr-2" />Security</>} delay={0.2}>
              <div className="space-y-4">
                <ToggleField control={form.control} name="anticall" label="ANTI_CALL" desc="Auto-reject voice/video calls" />
                <ToggleField control={form.control} name="antilink" label="ANTI_LINK" desc="Remove group invites/links" />
              </div>
            </CyberCard>

            {/* Social & Chat */}
            <CyberCard title={<><MessageSquare className="inline w-4 h-4 mr-2" />Social Engine</>} delay={0.3}>
              <div className="space-y-4">
                <ToggleField control={form.control} name="welcomeMessage" label="WELCOME_MSG" desc="Send group join greetings" />
                <ToggleField control={form.control} name="goodbyeMessage" label="GOODBYE_MSG" desc="Send group leave messages" />
                <ToggleField control={form.control} name="chatbot" label="AI_CHATBOT" desc="Enable conversational AI" />
                <ToggleField control={form.control} name="autoreaction" label="AUTO_REACTION" desc="React to messages randomly" />
              </div>
            </CyberCard>

            {/* Presence & Status */}
            <CyberCard title={<><Settings2 className="inline w-4 h-4 mr-2" />Presence</>} delay={0.4}>
              <div className="space-y-4">
                <ToggleField control={form.control} name="alwaysonline" label="ALWAYS_ONLINE" desc="Force online status" />
                <ToggleField control={form.control} name="autotyping" label="AUTO_TYPING" desc="Simulate typing indicator" />
                <ToggleField control={form.control} name="autoread" label="AUTO_READ_MSG" desc="Mark messages as read" />
                <ToggleField control={form.control} name="autoviewstatus" label="AUTO_VIEW_STATUS" desc="Watch statuses automatically" />
                <ToggleField control={form.control} name="autobio" label="AUTO_BIO_UPDATE" desc="Update bio with time dynamically" />
              </div>
            </CyberCard>
          </div>

          <CyberCard title={<><Heart className="inline w-4 h-4 mr-2" />Status Interactor</>} delay={0.5}>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <ToggleField control={form.control} name="autolikestatus" label="AUTO_LIKE_STATUS" desc="React to viewed statuses" />
              
              <FormField control={form.control} name="autolikestatus_emoji" render={({ field }) => (
                <FormItem className="flex-1 w-full max-w-xs">
                  <FormLabel className="font-mono text-primary text-xs">REACTION_EMOJI</FormLabel>
                  <FormControl>
                    <Input {...field} className="font-mono bg-black/50 text-center text-xl" />
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </CyberCard>

          {/* Fixed Save Button */}
          <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-primary/20 z-40 flex justify-end">
            <Button 
              type="submit" 
              className="cyber-button font-mono h-12 px-8 bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,200,255,0.4)]"
              disabled={updateMut.isPending}
            >
              <Save className="w-5 h-5 mr-2" />
              {updateMut.isPending ? 'COMMITTING...' : 'COMMIT_CHANGES'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Helper component for toggle switches
function ToggleField({ control, name, label, desc }: any) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-primary/10 bg-black/20 p-3 hover:border-primary/30 transition-colors">
        <div className="space-y-0.5">
          <FormLabel className="font-mono text-primary text-sm">{label}</FormLabel>
          <FormDescription className="font-mono text-xs text-muted-foreground">{desc}</FormDescription>
        </div>
        <FormControl>
          <Switch 
            checked={field.value} 
            onCheckedChange={field.onChange}
            className="data-[state=checked]:bg-primary"
          />
        </FormControl>
      </FormItem>
    )} />
  );
}
