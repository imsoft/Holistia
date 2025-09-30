import {
  RefreshCw,
  CloudUpload,
  Settings,
  Lock,
  Server,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    name: "Push to Deploy",
    description:
      "Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi lobortis.",
    icon: CloudUpload,
  },
  {
    name: "SSL Certificates",
    description:
      "Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi lobortis.",
    icon: Lock,
  },
  {
    name: "Simple Queues",
    description:
      "Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi lobortis.",
    icon: RefreshCw,
  },
  {
    name: "Advanced Security",
    description:
      "Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi lobortis.",
    icon: ShieldCheck,
  },
  {
    name: "Powerful API",
    description:
      "Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi lobortis.",
    icon: Settings,
  },
  {
    name: "Database Backups",
    description:
      "Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi lobortis.",
    icon: Server,
  },
];

export const FeaturesSection = () => {
  return (
    <div className="relative bg-background py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-md px-6 text-center sm:max-w-3xl lg:max-w-7xl lg:px-8">
        <h2 className="text-lg font-semibold text-primary">Deploy faster</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to deploy your app
        </p>
        <p className="mx-auto mt-5 max-w-prose text-xl text-muted-foreground">
          Phasellus lorem quam molestie id quisque diam aenean nulla in.
          Accumsan in quis quis nunc, ullamcorper malesuada. Eleifend
          condimentum id viverra nulla.
        </p>
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6">
                <div className="flow-root rounded-lg bg-card px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center rounded-xl bg-primary p-3 shadow-lg">
                        <feature.icon
                          aria-hidden="true"
                          className="size-8 text-primary-foreground"
                        />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg/8 font-semibold tracking-tight text-card-foreground">
                      {feature.name}
                    </h3>
                    <p className="mt-5 text-base/7 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
