#!/bin/sh

echo "Injecting runtime environment variables into index.html..."

CONFIG_BLOCK=$(cat << EOF
    <script id="twenty-env-config">
      window._env_ = {
        REACT_APP_SERVER_BASE_URL: "$REACT_APP_SERVER_BASE_URL"
      };
    </script>
    <!-- END: ExampleCRM Config -->
EOF
)
# Use sed to replace the config block in index.html
# Using pattern space to match across multiple lines
echo "$CONFIG_BLOCK" | sed -i.bak '
  /<!-- BEGIN: ExampleCRM Config -->/,/<!-- END: ExampleCRM Config -->/{
    /<!-- BEGIN: ExampleCRM Config -->/!{
      /<!-- END: ExampleCRM Config -->/!d
    }
    /<!-- BEGIN: ExampleCRM Config -->/r /dev/stdin
    /<!-- END: ExampleCRM Config -->/d
  }
' build/index.html
rm -f build/index.html.bak
