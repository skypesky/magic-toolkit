#!/bin/bash

org=$1
token=$GITHUB_BACKUP_GIT_TOKEN
slack_webhook_url=$GITHUB_BACKUP_SLACK_WEB_HOOK_URL
# 获取当前文件的绝对路径
current_file_path=$(realpath "$0")
# 获取当前文件所在目录
current_directory=$(dirname "$current_file_path")
dir="${dir:-$current_directory}"

log_file="$dir/.backup_progress.log"
org_meta_file="$dir/.$org.json"

# 检查 org, token, slack_webhook_url 是否为空
if [ -z "$org" ] || [ -z "$token" ] || [ -z "$slack_webhook_url" ]; then
  echo "org, token, and slack_webhook_url must not be empty"
  exit 1
fi

# 打开文件以供写入
touch "$log_file"

run_backup() {
  attempt_time=$(date +"%Y-%m-%d %H:%M:%S")
  echo "Attempt $1 at $attempt_time"

  result=$(mt github backup -o "$org" -t "$token" -d "$dir" 2>&1)

  if [[ $result == *"done: true"* ]]; then
    send_slack_message "GitHub backup org($org) completed successfully!" "success"
    return 0
  else
    log "result: $result"
    log "GitHub backup did not complete successfully."
    return 1
  fi
}

send_slack_message() {
  message_type="${2:-success}"

  # 从 a.json 文件中提取 summary 对象
  summary=$(jq '.summary' $org_meta_file)

  # 输出 summary 对象中的每个变量
  repoCount=$(echo "$summary" | jq -r '.repoCount')
  issueCount=$(echo "$summary" | jq -r '.issueCount')
  durationText=$(echo "$summary" | jq -r '.durationText')
  storageUsageText=$(echo "$summary" | jq -r '.storageUsageText')

  if [[ $message_type == "success" ]]; then
    payload='{
      "username": "GitHub Backup Bot",
      "attachments": [{
        "color": "good",
        "author_name": "Github Backup",
        "author_icon": "https://github.githubassets.com/favicon.ico",
        "text": "'"$1"'"
      }],
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Backup statistics*"
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "*RepoCount:*\n '"$repoCount"'"
            },
            {
              "type": "mrkdwn",
              "text": "*IssueCount:*\n '"$issueCount"'"
            },
            {
              "type": "mrkdwn",
              "text": "*Duration:*\n '"$durationText"'"
            },
            {
              "type": "mrkdwn",
              "text": "*UsedCapacity:*\n '"$storageUsageText"'"
            }
          ]
        }
      ]
    }'
  else
    payload='{
      "username": "GitHub Backup Bot",
      "attachments": [{
        "color": "danger",
        "author_name": "Github Backup",
        "author_icon": "https://github.githubassets.com/favicon.ico",
        "text": "'"$1"'"
      }]
    }'
  fi

  # 发送消息到 Slack
  response=$(curl -s -X POST -H "Content-Type: application/json" --data "$payload" "$slack_webhook_url")

  if [[ "$response" == "ok" ]]; then
    log "Slack message sent successfully!"
  else
    log "Failed to send Slack message."
    log $response
  fi
}

run_backup_with_retry() {
  max_retries="${1:-6}"
  retries=0

  while [ $retries -lt $max_retries ]; do
    if run_backup "$((retries + 1))"; then
      break
    fi

    ((retries++))
    log "Waiting for 1 hour before the next attempt..."
    sleep 3600
  done

  if [ $retries -eq $max_retries ]; then
    log "Maximum retries reached. GitHub backup not successful."
    send_slack_message "GitHub backup org($org) failed!" "danger"
  fi
}

log() {
  message="$(date +"%Y-%m-%d %H:%M:%S"): $1"

  echo $message
  # 将消息写入文件
  echo $message >>"$log_file"

  # 强制将缓冲区的内容写入文件
  sync
}

# 执行备份
run_backup_with_retry
