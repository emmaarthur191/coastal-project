class UserMessagePreference(models.Model):
    """User preferences for messaging features."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_preferences")

    # Sound & Notifications
    sound_enabled = models.BooleanField(default=True)
    notification_sound = models.CharField(
        max_length=50,
        default="default",
        choices=[("default", "Default"), ("chime", "Chime"), ("ding", "Ding"), ("bell", "Bell"), ("none", "Silent")],
    )

    # Privacy Settings
    read_receipts_enabled = models.BooleanField(default=True)
    typing_indicators_enabled = models.BooleanField(default=True)
    last_seen_visible = models.BooleanField(default=True)

    # Auto-delete
    auto_delete_enabled = models.BooleanField(default=False)
    auto_delete_days = models.IntegerField(
        default=30, choices=[(1, "24 Hours"), (7, "7 Days"), (30, "30 Days"), (90, "90 Days"), (365, "Never")]
    )

    # Message Formatting
    markdown_enabled = models.BooleanField(default=True)
    emoji_shortcuts_enabled = models.BooleanField(default=True)
    font_size = models.CharField(
        max_length=10, default="medium", choices=[("small", "Small"), ("medium", "Medium"), ("large", "Large")]
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_message_preference"
        verbose_name = "User Message Preference"
        verbose_name_plural = "User Message Preferences"

    def __str__(self):
        return f"Preferences for {self.user.username}"
