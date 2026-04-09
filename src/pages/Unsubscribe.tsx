import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "error" | "done">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }

    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setStatus(data?.success ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Se procesează...</p>
            </>
          )}
          {status === "valid" && (
            <>
              <MailX className="h-12 w-12 mx-auto text-muted-foreground" />
              <h1 className="text-xl font-semibold">Dezabonare email</h1>
              <p className="text-muted-foreground">
                Confirmi că nu mai dorești să primești emailuri de la AI-IDEI?
              </p>
              <Button onClick={handleUnsubscribe} variant="destructive" className="w-full">
                Confirmă dezabonarea
              </Button>
            </>
          )}
          {status === "done" && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
              <h1 className="text-xl font-semibold">Dezabonat cu succes</h1>
              <p className="text-muted-foreground">
                Nu vei mai primi emailuri de la noi.
              </p>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <h1 className="text-xl font-semibold">Deja dezabonat</h1>
              <p className="text-muted-foreground">
                Adresa ta de email este deja dezabonată.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <h1 className="text-xl font-semibold">Link invalid</h1>
              <p className="text-muted-foreground">
                Acest link de dezabonare este invalid sau a expirat.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
