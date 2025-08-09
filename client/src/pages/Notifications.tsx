import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  Mail, 
  MessageSquare, 
  Download, 
  Upload, 
  Paperclip, 
  Send, 
  X,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Indent,
  Outdent,
  Edit
} from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: 'mail' | 'sms';
  title: string;
  description: string;
  subject?: string;
  message?: string;
  toEmails?: string[];
  ccEmails?: string[];
  useBulkTemplate: boolean;
  status: 'draft' | 'sent' | 'failed';
  sentAt?: string;
  createdAt: string;
  sentCount?: number;
  failedCount?: number;
}

export default function Notifications() {
  const { toast } = useToast();
  const messageEditorRef = useRef<HTMLDivElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    type: 'mail' as 'mail' | 'sms',
    title: '',
    description: '',
    useBulkTemplate: false,
    toEmails: '',
    ccEmails: '',
    subject: '',
    message: '',
    attachments: [] as File[]
  });

  // Formatting functions
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateMessageFromEditor();
  };

  const updateMessageFromEditor = () => {
    if (messageEditorRef.current) {
      setFormData({ ...formData, message: messageEditorRef.current.innerHTML });
    }
  };

  const handleEditorInput = () => {
    updateMessageFromEditor();
  };

  const handleEditorFocus = () => {
    if (messageEditorRef.current && messageEditorRef.current.textContent === 'Enter your message content...') {
      messageEditorRef.current.textContent = '';
    }
  };

  const handleEditorBlur = () => {
    if (messageEditorRef.current && messageEditorRef.current.textContent === '') {
      messageEditorRef.current.textContent = 'Enter your message content...';
      messageEditorRef.current.style.color = '#9CA3AF';
    } else if (messageEditorRef.current) {
      messageEditorRef.current.style.color = '#000000';
    }
  };

  const insertList = (ordered: boolean) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const changeFontSize = (size: string) => {
    execCommand('fontSize', size);
  };

  const changeFontFamily = (font: string) => {
    execCommand('fontName', font);
  };

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(notificationData).forEach(key => {
        if (key === 'attachments') {
          notificationData[key].forEach((file: File) => {
            formDataToSend.append('attachments', file);
          });
        } else if (key === 'toEmails' || key === 'ccEmails') {
          // Split comma-separated emails into array
          const emails = notificationData[key].split(',').map((email: string) => email.trim()).filter(Boolean);
          formDataToSend.append(key, JSON.stringify(emails));
        } else {
          formDataToSend.append(key, notificationData[key]);
        }
      });

      // Use fetch directly for FormData
      const response = await fetch('/api/notifications', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create notification');
      }

      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: "Notification created successfully as draft",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest(`/api/notifications/${notificationId}/send`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNotificationMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return await apiRequest(`/api/notifications/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setEditingNotification(null);
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'mail',
      title: '',
      description: '',
      useBulkTemplate: false,
      toEmails: '',
      ccEmails: '',
      subject: '',
      message: '',
      attachments: []
    });
    setEditingNotification(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...Array.from(e.target.files)]
      });
    }
  };

  const removeAttachment = (index: number) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index)
    });
  };

  const startEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      type: notification.type,
      title: notification.title,
      description: notification.description || '',
      useBulkTemplate: notification.useBulkTemplate,
      toEmails: notification.toEmails?.join(', ') || '',
      ccEmails: notification.ccEmails?.join(', ') || '',
      subject: notification.subject || '',
      message: notification.message || '',
      attachments: []
    });
    setShowAddForm(true);
    
    // Update the rich text editor content
    setTimeout(() => {
      if (messageEditorRef.current) {
        messageEditorRef.current.innerHTML = notification.message || '';
        messageEditorRef.current.style.color = '#000000';
      }
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNotification) {
      // Update existing notification
      const updateData = {
        ...formData,
        toEmails: formData.toEmails.split(',').map(email => email.trim()).filter(Boolean),
        ccEmails: formData.ccEmails.split(',').map(email => email.trim()).filter(Boolean),
      };
      updateNotificationMutation.mutate({ id: editingNotification.id, updates: updateData });
    } else {
      // Create new notification
      createNotificationMutation.mutate(formData);
    }
  };

  const downloadTemplate = () => {
    // Create and download a CSV template
    const headers = ['email', 'name', 'subject', 'message'];
    const csvContent = headers.join(',') + '\n' + 
                      'example@email.com,John Doe,Sample Subject,Sample Message';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notification-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'draft': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Manage and send notifications to applicants</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Notification
        </Button>
      </div>

      {/* Add Notification Form */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingNotification ? 'Edit Notification' : 'Create New Notification'}</CardTitle>
            <CardDescription>
              {editingNotification 
                ? 'Update the notification details below' 
                : 'Send email notifications to applicants individually or in bulk'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Notification Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Notification Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'mail' | 'sms') => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mail">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="sms" disabled>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        SMS (Coming Soon)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title of Notification</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter notification title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description"
                    required
                  />
                </div>
              </div>

              {/* Bulk Upload Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="bulk-toggle">Use Bulk Upload Template</Label>
                  <p className="text-sm text-gray-600">
                    Upload a CSV file with recipient details and personalized content
                  </p>
                </div>
                <Switch
                  id="bulk-toggle"
                  checked={formData.useBulkTemplate}
                  onCheckedChange={(checked) => setFormData({...formData, useBulkTemplate: checked})}
                />
              </div>

              {/* Bulk Upload Section */}
              {formData.useBulkTemplate && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </Button>
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      <Label htmlFor="bulk-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Upload Template
                      </Label>
                      <Input
                        id="bulk-upload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Email Fields */}
              {!formData.useBulkTemplate && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="toEmails">To (Email Addresses)</Label>
                      <Input
                        id="toEmails"
                        value={formData.toEmails}
                        onChange={(e) => setFormData({...formData, toEmails: e.target.value})}
                        placeholder="Enter email addresses separated by commas"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ccEmails">CC (Email Addresses)</Label>
                      <Input
                        id="ccEmails"
                        value={formData.ccEmails}
                        onChange={(e) => setFormData({...formData, ccEmails: e.target.value})}
                        placeholder="Enter CC email addresses separated by commas"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Notification Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Enter email subject"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notification Message</Label>
                    <div className="border border-gray-300 rounded-md">
                      {/* Rich Text Formatting Toolbar */}
                      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-200 bg-gray-50">
                        {/* Font Family and Size */}
                        <Select onValueChange={changeFontFamily}>
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Courier New">Courier New</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select onValueChange={changeFontSize}>
                          <SelectTrigger className="w-[70px] h-8">
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">8pt</SelectItem>
                            <SelectItem value="2">10pt</SelectItem>
                            <SelectItem value="3">12pt</SelectItem>
                            <SelectItem value="4">14pt</SelectItem>
                            <SelectItem value="5">18pt</SelectItem>
                            <SelectItem value="6">24pt</SelectItem>
                            <SelectItem value="7">36pt</SelectItem>
                          </SelectContent>
                        </Select>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Text Formatting */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => execCommand('bold')}
                          title="Bold"
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => execCommand('italic')}
                          title="Italic"
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => execCommand('underline')}
                          title="Underline"
                        >
                          <Underline className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Alignment */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => execCommand('justifyLeft')}
                          title="Align Left"
                        >
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => execCommand('justifyCenter')}
                          title="Align Center"
                        >
                          <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => execCommand('justifyRight')}
                          title="Align Right"
                        >
                          <AlignRight className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Lists */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => insertList(false)}
                          title="Bullet List"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => insertList(true)}
                          title="Numbered List"
                        >
                          <ListOrdered className="h-4 w-4" />
                        </Button>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {/* Indentation */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => execCommand('indent')}
                          title="Increase Indent"
                        >
                          <Indent className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => execCommand('outdent')}
                          title="Decrease Indent"
                        >
                          <Outdent className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Rich Text Editor */}
                      <div
                        ref={messageEditorRef}
                        contentEditable
                        className="min-h-[200px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onInput={handleEditorInput}
                        onFocus={handleEditorFocus}
                        onBlur={handleEditorBlur}
                        style={{ 
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          color: '#9CA3AF'
                        }}
                        suppressContentEditableWarning={true}
                        dangerouslySetInnerHTML={{ __html: 'Enter your message content...' }}
                      />
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-4">
                    <Label>Attachments</Label>
                    <div className="flex items-center gap-4">
                      <Label htmlFor="attachments" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                          <Paperclip className="w-4 h-4" />
                          Attach Files
                        </div>
                      </Label>
                      <Input
                        id="attachments"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    
                    {/* Display attached files */}
                    {formData.attachments.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Attached Files:</Label>
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createNotificationMutation.isPending || updateNotificationMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {editingNotification ? 'Update Notification' : 'Create Notification'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
        
        {notifications && notifications.length > 0 ? (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <Badge className={getStatusColor(notification.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(notification.status)}
                            {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                          </div>
                        </Badge>
                        <Badge variant="outline">
                          <Mail className="w-3 h-3 mr-1" />
                          {notification.type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{notification.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created {format(new Date(notification.createdAt), 'MMM dd, yyyy')}
                        </div>
                        {notification.sentAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Sent {format(new Date(notification.sentAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {notification.sentCount && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {notification.sentCount} recipients
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {notification.status === 'draft' && (
                        <>
                          <Button
                            onClick={() => startEdit(notification)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => sendNotificationMutation.mutate(notification.id)}
                            disabled={sendNotificationMutation.isPending}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Send Now
                          </Button>
                        </>
                      )}
                      {notification.status === 'sent' && (
                        <Button
                          onClick={() => startEdit(notification)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      )}
                      {notification.status === 'failed' && (
                        <>
                          <Button
                            onClick={() => startEdit(notification)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => sendNotificationMutation.mutate(notification.id)}
                            disabled={sendNotificationMutation.isPending}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Retry Send
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600 mb-4">Create your first notification to get started</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Notification
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}