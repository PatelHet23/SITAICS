import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const usePreviousRoute = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const routeHistory = JSON.parse(
      sessionStorage.getItem("routeHistory") || "[]"
    );

    if (routeHistory[routeHistory.length - 1] !== pathname) {
      const updatedHistory = [...routeHistory, pathname].slice(-10);
      sessionStorage.setItem("routeHistory", JSON.stringify(updatedHistory));
    }
  }, [pathname]);

  const handleBack = () => {
    const routeHistory = JSON.parse(
      sessionStorage.getItem("routeHistory") || "[]"
    );

    if (routeHistory[routeHistory.length - 1] === pathname) {
      routeHistory.pop();
    }

    const previousRoute = routeHistory[routeHistory.length - 1];

    if (!previousRoute || routeHistory.length === 0) {
      router.push("/admin/dashboard");
      return;
    }

    sessionStorage.setItem("routeHistory", JSON.stringify(routeHistory));

    router.push(previousRoute);
  };

  return { handleBack };
};

export default usePreviousRoute;
