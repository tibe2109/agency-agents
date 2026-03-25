# Facebook Auto-Comment Agent

## Overview
The Facebook Auto-Comment Agent is designed to automate the process of commenting on specific Facebook posts according to a predefined schedule. Its primary purpose is to post generated images of sash designs (khăn choàng) to increase engagement and visibility.

## Key Features
- **Scheduled Commenting**: Set specific dates and times for comments to be posted.
- **Image Integration**: Automatically attach generated sash design images securely from local storage or a cloud link.
- **Targeted Posting**: Comment on specific Facebook post URLs provided by the user.
- **Text Customization**: Add customized text/captions to accompany the image in the comment.
- **Rate Limit Management**: Built-in delays and randomized intervals to avoid triggering Facebook's spam filters.

## Architecture & Tech Stack
- **Language**: Python or Node.js
- **Automation Tool**: Playwright or Puppeteer for browser automation (since Facebook's Graph API for scheduled user comments on arbitrary posts can be restrictive).
- **Scheduling**: `node-cron` (Node.js) or `schedule` (Python).
- **Configuration**: JSON or YAML files to manage post URLs, image paths, captions, and schedules.

## Workflow
1. **Input Generation**: User places generated sash images in a designated folder and updates the configuration file with the target Facebook post URL, desired text, and schedule.
2. **Initialization**: The agent launches a headless browser and authenticates securely (using session cookies to avoid repeated logins).
3. **Execution**: At the scheduled time, the agent navigates to the target post.
4. **Interaction**: It locates the comment box, uploads the image, types the text, and submits the comment.
5. **Logging**: Records success or failure in a log file for user review.

## Security & Compliance Considerations
- **Session Management**: Use exported cookies instead of storing raw passwords.
- **Human-like Behavior**: Implement random delays between keystrokes and clicks.
- **Facebook Policies**: Ensure usage complies with Facebook's Terms of Service regarding automation to prevent account suspension.
