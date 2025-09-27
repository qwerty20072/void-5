
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MobileDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        isMobile,
        touchSupport: 'ontouchstart' in window,
        platform: navigator.platform,
        viewport: {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
        },
        orientation: window.screen.orientation?.type || 'unknown',
      });
    };

    updateDebugInfo();
    window.addEventListener('resize', updateDebugInfo);
    window.addEventListener('orientationchange', updateDebugInfo);

    return () => {
      window.removeEventListener('resize', updateDebugInfo);
      window.removeEventListener('orientationchange', updateDebugInfo);
    };
  }, [isMobile]);

  // Only show debug info in development or when specifically enabled
  if (process.env.NODE_ENV === 'production' && !localStorage.getItem('mobile-debug')) {
    return null;
  }

  if (!isVisible) {
    return (
      <Button
        className="fixed bottom-4 left-4 z-50 bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1"
        onClick={() => setIsVisible(true)}
      >
        Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80 max-h-96 overflow-auto bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader className="p-3">
        <CardTitle className="text-sm flex justify-between items-center">
          Mobile Debug Info
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2 text-xs">
          <div><strong>Mobile Detected:</strong> {isMobile ? 'Yes' : 'No'}</div>
          <div><strong>Touch Support:</strong> {debugInfo.touchSupport ? 'Yes' : 'No'}</div>
          <div><strong>Screen:</strong> {debugInfo.screenWidth}×{debugInfo.screenHeight}</div>
          <div><strong>Window:</strong> {debugInfo.windowWidth}×{debugInfo.windowHeight}</div>
          <div><strong>Viewport:</strong> {debugInfo.viewport?.width}×{debugInfo.viewport?.height}</div>
          <div><strong>DPR:</strong> {debugInfo.devicePixelRatio}</div>
          <div><strong>Orientation:</strong> {debugInfo.orientation}</div>
          <div><strong>Platform:</strong> {debugInfo.platform}</div>
          <div className="mt-2">
            <strong>User Agent:</strong>
            <div className="break-all text-xs opacity-75">
              {debugInfo.userAgent}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileDebugger;
